import os
import uuid
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/presentations"]
PRESENTATION_ID = "1j4EAewWQeKBmRw726HbjKWAswic5EA9yPdOhUSk_8Cw"

NAVY       = {"red": 30/255,  "green": 58/255,  "blue": 138/255}
LIGHT_BLUE = {"red": 239/255, "green": 246/255, "blue": 255/255}
WHITE      = {"red": 1.0,     "green": 1.0,     "blue": 1.0}

SLIDE_H = 5143500

# Diagram geometry — right half of slide
BOX_W   = 2100000
BOX_H   = 540000
ARROW_W = 160000
ARROW_H = 220000
START_X = 5700000   # left edge of diagram (right zone)

STEPS = [
    # (label, fill, border_or_None, text_color)
    ("Financial Documents", LIGHT_BLUE, NAVY,  NAVY),
    ("LLM Extraction",      NAVY,       None,  WHITE),
    ("Rules Engine",        LIGHT_BLUE, NAVY,  NAVY),
    ("Decision Report",     NAVY,       None,  WHITE),
]

TOTAL_H = len(STEPS) * BOX_H + (len(STEPS) - 1) * ARROW_H
START_Y = (SLIDE_H - TOTAL_H) // 2


def authenticate():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as f:
            f.write(creds.to_json())
    return creds


def uid():
    return "s" + uuid.uuid4().hex[:12]


def extract_text(shape):
    parts = []
    if "text" not in shape:
        return ""
    for elem in shape["text"].get("textElements", []):
        if "textRun" in elem:
            parts.append(elem["textRun"]["content"])
    return "".join(parts).strip()


def find_llm_slide(slides):
    for slide in slides:
        for element in slide.get("pageElements", []):
            shape = element.get("shape", {})
            text = extract_text(shape)
            if "LLM" in text and "Assisted" in text:
                return slide
    return None


def make_box(obj_id, slide_id, x, y, w, h, fill, border):
    outline = (
        {
            "outlineFill": {"solidFill": {"color": {"rgbColor": border}}},
            "weight": {"magnitude": 1, "unit": "PT"},
            "propertyState": "RENDERED",
        }
        if border
        else {"propertyState": "NOT_RENDERED"}
    )
    return [
        {
            "createShape": {
                "objectId": obj_id,
                "shapeType": "ROUND_RECTANGLE",
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {
                        "width":  {"magnitude": w, "unit": "EMU"},
                        "height": {"magnitude": h, "unit": "EMU"},
                    },
                    "transform": {
                        "scaleX": 1, "scaleY": 1,
                        "translateX": x, "translateY": y,
                        "unit": "EMU",
                    },
                },
            }
        },
        {
            "updateShapeProperties": {
                "objectId": obj_id,
                "shapeProperties": {
                    "shapeBackgroundFill": {
                        "solidFill": {"color": {"rgbColor": fill}}
                    },
                    "outline": outline,
                },
                "fields": "shapeBackgroundFill,outline",
            }
        },
    ]


def make_arrow(obj_id, slide_id, x, y, w, h):
    return [
        {
            "createShape": {
                "objectId": obj_id,
                "shapeType": "DOWN_ARROW",
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {
                        "width":  {"magnitude": w, "unit": "EMU"},
                        "height": {"magnitude": h, "unit": "EMU"},
                    },
                    "transform": {
                        "scaleX": 1, "scaleY": 1,
                        "translateX": x, "translateY": y,
                        "unit": "EMU",
                    },
                },
            }
        },
        {
            "updateShapeProperties": {
                "objectId": obj_id,
                "shapeProperties": {
                    "shapeBackgroundFill": {
                        "solidFill": {"color": {"rgbColor": NAVY}}
                    },
                    "outline": {"propertyState": "NOT_RENDERED"},
                },
                "fields": "shapeBackgroundFill,outline",
            }
        },
    ]


def main():
    creds = authenticate()
    service = build("slides", "v1", credentials=creds)
    presentation = service.presentations().get(presentationId=PRESENTATION_ID).execute()

    slides = presentation.get("slides", [])
    llm_slide = find_llm_slide(slides)
    if not llm_slide:
        print("Could not find LLM-Assisted Operations slide.")
        return

    slide_id = llm_slide["objectId"]
    print(f"Found LLM slide: {slide_id}")

    requests = []

    # Small header label above the diagram
    header_id = uid()
    requests += make_box(
        header_id, slide_id,
        START_X, START_Y - 350000,
        BOX_W, 260000,
        {"red": 1.0, "green": 1.0, "blue": 1.0}, None,
    )
    requests.append({
        "insertText": {"objectId": header_id, "insertionIndex": 0, "text": "Processing Pipeline"}
    })
    requests.append({
        "updateTextStyle": {
            "objectId": header_id,
            "textRange": {"type": "ALL"},
            "style": {
                "bold": True,
                "fontSize": {"magnitude": 13, "unit": "PT"},
                "foregroundColor": {"opaqueColor": {"rgbColor": NAVY}},
            },
            "fields": "bold,fontSize,foregroundColor",
        }
    })
    requests.append({
        "updateParagraphStyle": {
            "objectId": header_id,
            "textRange": {"type": "ALL"},
            "style": {"alignment": "CENTER"},
            "fields": "alignment",
        }
    })

    # Flow boxes and arrows
    for i, (label, fill, border, text_color) in enumerate(STEPS):
        y = START_Y + i * (BOX_H + ARROW_H)

        box_id = uid()
        requests += make_box(box_id, slide_id, START_X, y, BOX_W, BOX_H, fill, border)
        requests.append({
            "insertText": {"objectId": box_id, "insertionIndex": 0, "text": label}
        })
        requests.append({
            "updateTextStyle": {
                "objectId": box_id,
                "textRange": {"type": "ALL"},
                "style": {
                    "bold": True,
                    "fontSize": {"magnitude": 16, "unit": "PT"},
                    "foregroundColor": {"opaqueColor": {"rgbColor": text_color}},
                },
                "fields": "bold,fontSize,foregroundColor",
            }
        })
        requests.append({
            "updateParagraphStyle": {
                "objectId": box_id,
                "textRange": {"type": "ALL"},
                "style": {"alignment": "CENTER"},
                "fields": "alignment",
            }
        })

        if i < len(STEPS) - 1:
            arrow_id = uid()
            arrow_x = START_X + BOX_W // 2 - ARROW_W // 2
            arrow_y = y + BOX_H
            requests += make_arrow(arrow_id, slide_id, arrow_x, arrow_y, ARROW_W, ARROW_H)

    service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={"requests": requests},
    ).execute()
    print(f"Done — {len(requests)} ops added to slide {slide_id}")


if __name__ == "__main__":
    main()
