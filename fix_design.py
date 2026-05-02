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

SLIDE_H = 5143500


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

        # Delete old light-blue cards
        for element in slide.get("pageElements", []):
            if is_light_blue_card(element):
                requests.append({"deleteObject": {"objectId": element["objectId"]}})
                print(f"  Deleted old card on [{slide_id}]")

        new_card_ids = []

        for element in slide.get("pageElements", []):
            shape = element.get("shape", {})
            if not shape or not has_bullets(shape):
                continue

            obj_id = element["objectId"]
            x, y, w, h = get_bounds(element)
            if w == 0 or h == 0:
                continue

            # Navy bullet text color so glyphs match the theme
            requests.append({
                "updateTextStyle": {
                    "objectId": obj_id,
                    "textRange": {"type": "ALL"},
                    "style": {
                        "foregroundColor": {"opaqueColor": {"rgbColor": NAVY}}
                    },
                    "fields": "foregroundColor",
                }
            })

            # Rebuild card: tight top, generous sides and bottom
            h_pad = 180000   # 0.20" sides
            top_pad = 60000  # 0.07" top — keeps clear of description above
            bot_pad = 260000 # 0.28" bottom — breathing room
            card_id = uid()
            requests += make_card(
                card_id, slide_id,
                x - h_pad,
                y - top_pad,
                w + 2 * h_pad,
                h + top_pad + bot_pad,
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
