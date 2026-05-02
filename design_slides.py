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

NAVY      = {"red": 30/255,  "green": 58/255,  "blue": 138/255}
LIGHT_BLUE = {"red": 239/255, "green": 246/255, "blue": 255/255}  # #EFF6FF

SLIDE_W = 9144000
SLIDE_H = 5143500
BAR_W   = 55000   # ~1.5 mm left accent strip


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


def get_bounds(element):
    t = element.get("transform", {})
    s = element.get("size", {})
    sx = t.get("scaleX", 1.0)
    sy = t.get("scaleY", 1.0)
    return (
        t.get("translateX", 0),
        t.get("translateY", 0),
        s.get("width",  {}).get("magnitude", 0) * sx,
        s.get("height", {}).get("magnitude", 0) * sy,
    )


def make_rect(obj_id, slide_id, x, y, w, h, fill, border=None, shape_type="RECTANGLE"):
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
                "shapeType": shape_type,
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
                        "solidFill": {"color": {"rgbColor": fill}}
                    },
                    "outline": outline,
                },
                "fields": "shapeBackgroundFill,outline",
            }
        },
    ]


def main():
    creds = authenticate()
    service = build("slides", "v1", credentials=creds)
    presentation = service.presentations().get(presentationId=PRESENTATION_ID).execute()

    all_requests = []

    for slide in presentation.get("slides", []):
        slide_id = slide["objectId"]
        if slide_id in BA_SLIDE_IDS:
            continue

        slide_requests = []
        slide_shape_ids = []

        # --- Navy left accent bar ---
        bar_id = uid()
        slide_requests += make_rect(bar_id, slide_id, 0, 0, BAR_W, SLIDE_H, NAVY)
        slide_shape_ids.insert(0, bar_id)  # bar goes furthest back

        # --- Light blue card behind each bullet text box ---
        for element in slide.get("pageElements", []):
            shape = element.get("shape", {})
            if not shape or not has_bullets(shape):
                continue

            x, y, w, h = get_bounds(element)
            if w == 0 or h == 0:
                continue

            pad = 150000  # ~4mm padding around text
            card_id = uid()
            slide_requests += make_rect(
                card_id, slide_id,
                x - pad, y - pad,
                w + 2 * pad, h + 2 * pad,
                LIGHT_BLUE, NAVY,
                "ROUND_RECTANGLE",
            )
            slide_shape_ids.append(card_id)
            print(f"  Card [{slide_id}]: pos=({x/914400:.2f}\", {y/914400:.2f}\")")

        # Send new shapes behind existing content (per slide — IDs must be same page)
        if slide_shape_ids:
            slide_requests.append({
                "updatePageElementsZOrder": {
                    "pageElementObjectIds": slide_shape_ids,
                    "operation": "SEND_TO_BACK",
                }
            })

        all_requests += slide_requests
        print(f"  Slide [{slide_id}]: {len(slide_requests)} ops")

    if not all_requests:
        print("Nothing to change.")
        return

    service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={"requests": all_requests},
    ).execute()
    print(f"\nDone — {len(all_requests)} total changes.")


if __name__ == "__main__":
    main()
