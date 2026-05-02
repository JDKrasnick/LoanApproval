import os
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

NAVY = {"red": 30/255, "green": 58/255, "blue": 138/255}


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


def extract_text(shape):
    parts = []
    if "text" not in shape:
        return ""
    for elem in shape["text"].get("textElements", []):
        if "textRun" in elem:
            parts.append(elem["textRun"]["content"])
    return "".join(parts).strip()


def get_font_size(shape):
    if "text" not in shape:
        return 0
    for elem in shape["text"].get("textElements", []):
        if "textRun" in elem:
            size = elem["textRun"].get("style", {}).get("fontSize", {})
            return size.get("magnitude", 0) if size else 0
    return 0


def is_section_label(text):
    return text.isupper() and len(text) < 35


def is_footer(text):
    return text == "LoanApproval" or text.strip().isdigit()


def is_title(text, font_size):
    if not text or is_section_label(text) or is_footer(text):
        return False
    if text.startswith("- ") or "\n- " in text:
        return False
    return font_size >= 24


def has_manual_bullets(text):
    return text.startswith("- ") or "\n- " in text


def clean_bullet_text(text):
    return "\n".join(
        line[2:] if line.startswith("- ") else line
        for line in text.split("\n")
    )


def main():
    creds = authenticate()
    service = build("slides", "v1", credentials=creds)
    presentation = service.presentations().get(presentationId=PRESENTATION_ID).execute()

    requests = []

    for slide in presentation.get("slides", []):
        slide_id = slide["objectId"]
        if slide_id in BA_SLIDE_IDS:
            continue

        for element in slide.get("pageElements", []):
            obj_id = element["objectId"]
            shape = element.get("shape", {})
            if not shape:
                continue

            text = extract_text(shape)
            font_size = get_font_size(shape)

            if not text:
                continue

            if is_title(text, font_size):
                print(f"  Title → navy [{slide_id}]: {repr(text[:50])}")
                requests.append({
                    "updateTextStyle": {
                        "objectId": obj_id,
                        "textRange": {"type": "ALL"},
                        "style": {
                            "foregroundColor": {"opaqueColor": {"rgbColor": NAVY}}
                        },
                        "fields": "foregroundColor"
                    }
                })

            elif has_manual_bullets(text):
                clean = clean_bullet_text(text)
                print(f"  Bullets → proper [{slide_id}]: {len(clean.splitlines())} items")
                requests += [
                    {"deleteText": {"objectId": obj_id, "textRange": {"type": "ALL"}}},
                    {"insertText": {"objectId": obj_id, "insertionIndex": 0, "text": clean}},
                    {
                        "createParagraphBullets": {
                            "objectId": obj_id,
                            "textRange": {"type": "ALL"},
                            "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE"
                        }
                    },
                ]

    if not requests:
        print("Nothing to change.")
        return

    service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={"requests": requests}
    ).execute()
    print(f"\nDone — {len(requests)} changes applied.")


if __name__ == "__main__":
    main()
