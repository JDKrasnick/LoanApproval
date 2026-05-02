import json
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/presentations.readonly"]
PRESENTATION_ID = "1j4EAewWQeKBmRw726HbjKWAswic5EA9yPdOhUSk_8Cw"


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
    text_parts = []
    if "text" not in shape:
        return ""
    for elem in shape["text"].get("textElements", []):
        if "textRun" in elem:
            text_parts.append(elem["textRun"]["content"])
    return "".join(text_parts).strip()


def main():
    creds = authenticate()
    service = build("slides", "v1", credentials=creds)
    presentation = service.presentations().get(presentationId=PRESENTATION_ID).execute()

    slides = presentation.get("slides", [])
    print(f"Total slides: {len(slides)}\n")

    for i, slide in enumerate(slides):
        slide_id = slide["objectId"]
        print(f"--- Slide {i+1} (id: {slide_id}) ---")
        for element in slide.get("pageElements", []):
            shape = element.get("shape", {})
            text = extract_text(shape)
            if text:
                shape_type = shape.get("shapeType", "UNKNOWN")
                print(f"  [{shape_type}] {repr(text)}")
        print()


if __name__ == "__main__":
    main()
