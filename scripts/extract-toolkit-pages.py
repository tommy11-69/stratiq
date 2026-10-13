import json
import os
import sys
from pypdf import PdfReader

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pdf_path = os.path.join(root_dir, 'source', 'GoUp Performance Marketer Toolkits - 8.pdf')
    out_dir = os.path.join(root_dir, 'packages', 'registry', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'extracted_pages.json')

    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}", file=sys.stderr)
        sys.exit(1)

    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"Reading {total_pages} pages from {pdf_path}...")

    pages = []
    for i, page in enumerate(reader.pages):
        page_num = i + 1
        text = page.extract_text() or ""
        pages.append({
            "page_pdf": page_num,
            "text": text
        })

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            "source_pdf": "GoUp Performance Marketer Toolkits - 8.pdf",
            "total_pages": total_pages,
            "pages": pages
        }, f, indent=2, ensure_ascii=False)

    print(f"Extracted {total_pages} pages to {out_path}")

if __name__ == '__main__':
    main()
