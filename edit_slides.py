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


def fix_section_header_text(service, slide, requests):
    for element in slide.get("pageElements", []):
        shape = element.get("shape", {})
        text = extract_text(shape)
        if text == "DEVS:\nProduct Walkthrough":
            obj_id = element["objectId"]
            requests.append({
                "deleteText": {
                    "objectId": obj_id,
                    "textRange": {"type": "ALL"}
                }
            })
            requests.append({
                "insertText": {
                    "objectId": obj_id,
                    "insertionIndex": 0,
                    "text": "DEVS: Product Walkthrough"
                }
            })
            print(f"  Fixed section header text on slide {slide['objectId']}")


def main():
    creds = authenticate()
    service = build("slides", "v1", credentials=creds)
    presentation = service.presentations().get(presentationId=PRESENTATION_ID).execute()

    slides = presentation.get("slides", [])
    requests = []

    for slide in slides:
        slide_id = slide["objectId"]
        if slide_id in BA_SLIDE_IDS:
            continue

        fix_section_header_text(service, slide, requests)

        for element in slide.get("pageElements", []):
            obj_id = element["objectId"]
            shape = element.get("shape", {})
            text = extract_text(shape)

            if text.startswith("INSERT"):
                print(f"  Removing placeholder [{slide_id}]: {repr(text)}")
                requests.append({"deleteObject": {"objectId": obj_id}})

    if not requests:
        print("Nothing to change.")
        return

    service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={"requests": requests}
    ).execute()
    print(f"\nDone — applied {len(requests)} changes.")


if __name__ == "__main__":
    main()
