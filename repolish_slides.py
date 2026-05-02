import os
import uuid
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/presentations"]
PRESENTATION_ID = "1j4EAewWQeKBmRw726HbjKWAswic5EA9yPdOhUSk_8Cw"

BA_SLIDE_IDS = {
    "g3db4de0dd20_1_147",
    "g3db4de0dd20_2_112",
    "g3db4de0dd20_2_283",
    "g3db4de0dd20_2_167",
    "g3db4de0dd20_2_140",
}

NAVY       = {"red": 30/255,  "green": 58/255,  "blue": 138/255}
LIGHT_BLUE = {"red": 239/255, "green": 246/255, "blue": 255/255}
BODY_COLOR = {"red": 55/255,  "green": 65/255,  "blue": 81/255}   # #374151 softer slate


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


def has_bullets(shape):
    if "text" not in shape:
        return False
    text = extract_text(shape)
    if text.startswith("- ") or "\n- " in text:
        return True
    for elem in shape["text"].get("textElements", []):
        if "paragraphMarker" in elem and "bullet" in elem["paragraphMarker"]:
            return True
    return False


def is_section_label(text):
    return text.isupper() and len(text) < 35


def is_footer(text):
    return text == "LoanApproval" or text.strip().isdigit()


def has_bold_runs(shape):
    if "text" not in shape:
        return False
    for elem in shape["text"].get("textElements", []):
        if "textRun" in elem:
            if elem["textRun"].get("style", {}).get("bold", False):
                return True
    return False


def is_description_text(shape):
    text = extract_text(shape)
    # Long enough to be a paragraph, not a label/footer/bullet
    if not text or len(text) < 50:
        return False
    if is_section_label(text) or is_footer(text):
        return False
    if has_bullets(shape):
        return False
    return has_bold_runs(shape)


def is_light_blue_card(element):
    shape = element.get("shape", {})
    if shape.get("shapeType") != "ROUND_RECTANGLE":
        return False
    rgb = (
        shape.get("shapeProperties", {})
        .get("shapeBackgroundFill", {})
        .get("solidFill", {})
        .get("color", {})
        .get("rgbColor", {})
    )
    return (
        abs(rgb.get("red",   0) - 239/255) < 0.05
        and abs(rgb.get("green", 0) - 246/255) < 0.05
        and abs(rgb.get("blue",  0) - 1.0)     < 0.05
    )


def get_bounds(element):
    t = element.get("transform", {})
    s = element.get("size", {})
    return (
        t.get("translateX", 0),
        t.get("translateY", 0),
        s.get("width",  {}).get("magnitude", 0) * t.get("scaleX", 1.0),
        s.get("height", {}).get("magnitude", 0) * t.get("scaleY", 1.0),
    )


def make_card(obj_id, slide_id, x, y, w, h):
    return [
        {
            "createShape": {
                "objectId": obj_id,
                "shapeType": "ROUND_RECTANGLE",
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {
                        "width":  {"magnitude": max(w, 1), "unit": "EMU"},
                        "height": {"magnitude": max(h, 1), "unit": "EMU"},
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
                        "solidFill": {"color": {"rgbColor": LIGHT_BLUE}}
                    },
                    "outline": {
                        "outlineFill": {"solidFill": {"color": {"rgbColor": NAVY}}},
                        "weight": {"magnitude": 1, "unit": "PT"},
                        "propertyState": "RENDERED",
                    },
                },
                "fields": "shapeBackgroundFill,outline",
            }
        },
    ]


def main():
    creds = authenticate()
    service = build("slides", "v1", credentials=creds)
    presentation = service.presentations().get(presentationId=PRESENTATION_ID).execute()

    requests = []

    for slide in presentation.get("slides", []):
        slide_id = slide["objectId"]
        if slide_id in BA_SLIDE_IDS:
            continue

        # Delete existing light-blue cards so we can rebuild them
        for element in slide.get("pageElements", []):
            if is_light_blue_card(element):
                requests.append({"deleteObject": {"objectId": element["objectId"]}})

        new_card_ids = []

        for element in slide.get("pageElements", []):
            shape = element.get("shape", {})
            if not shape:
                continue

            obj_id = element["objectId"]

            # Soften big bold description blocks
            if is_description_text(shape):
                text = extract_text(shape)
                print(f"  Softening [{slide_id}]: {repr(text[:60])}")
                requests.append({
                    "updateTextStyle": {
                        "objectId": obj_id,
                        "textRange": {"type": "ALL"},
                        "style": {
                            "bold": False,
                            "foregroundColor": {"opaqueColor": {"rgbColor": BODY_COLOR}},
                        },
                        "fields": "bold,foregroundColor",
                    }
                })

            # Rebuild bullet cards with uniform balanced padding
            if has_bullets(shape):
                x, y, w, h = get_bounds(element)
                if w == 0 or h == 0:
                    continue
                pad = 130000
                card_id = uid()
                requests += make_card(
                    card_id, slide_id,
                    x - pad, y - pad,
                    w + 2 * pad, h + 2 * pad,
                )
                new_card_ids.append(card_id)
                print(f"  Card [{slide_id}]: ({x/914400:.2f}\", {y/914400:.2f}\")")

        if new_card_ids:
            requests.append({
                "updatePageElementsZOrder": {
                    "pageElementObjectIds": new_card_ids,
                    "operation": "SEND_TO_BACK",
                }
            })

    if not requests:
        print("Nothing to change.")
        return

    service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={"requests": requests},
    ).execute()
    print(f"\nDone — {len(requests)} changes.")


if __name__ == "__main__":
    main()
