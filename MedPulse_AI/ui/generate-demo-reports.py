import os
from PIL import Image, ImageDraw, ImageFont

def create_report(filename, title, patient, date, text_lines):
    # Create a white background image
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to load a generic font, fallback to default
    try:
        font_title = ImageFont.truetype("arial.ttf", 36)
        font_header = ImageFont.truetype("arial.ttf", 24)
        font_text = ImageFont.truetype("consola.ttf", 20) # monospaced for alignment
    except:
        font_title = ImageFont.load_default()
        font_header = ImageFont.load_default()
        font_text = ImageFont.load_default()

    # Draw header
    draw.text((50, 50), "METROCARE DIAGNOSTICS", fill="black", font=font_title)
    draw.text((50, 100), f"Report Title: {title}", fill="black", font=font_header)
    draw.text((50, 130), f"Patient: {patient}", fill="black", font=font_header)
    draw.text((50, 160), f"Date: {date}", fill="black", font=font_header)
    
    draw.line((50, 200, 750, 200), fill="black", width=2)
    
    # Draw table headers
    draw.text((50, 220), "TEST NAME", fill="black", font=font_header)
    draw.text((350, 220), "RESULT", fill="black", font=font_header)
    draw.text((450, 220), "UNITS", fill="black", font=font_header)
    draw.text((550, 220), "REF. RANGE", fill="black", font=font_header)
    
    draw.line((50, 260, 750, 260), fill="black", width=2)
    
    # Draw text lines (tests)
    y = 280
    for line in text_lines:
        # line is a tuple (name, result, units, ref)
        draw.text((50, y), line[0], fill="black", font=font_text)
        draw.text((350, y), line[1], fill="black", font=font_text)
        draw.text((450, y), line[2], fill="black", font=font_text)
        draw.text((550, y), line[3], fill="black", font=font_text)
        y += 40
        
    draw.line((50, y+20, 750, y+20), fill="black", width=2)
    draw.text((50, y+50), "Authorized Signatory: Dr. Ananya Mehta", fill="black", font=font_header)
    draw.text((50, y+80), "*** End of Report ***", fill="black", font=font_header)
    
    os.makedirs("demo_reports", exist_ok=True)
    img.save(f"demo_reports/{filename}.png")
    print(f"Generated {filename}.png")

reports = [
    {
        "filename": "CBC_Report",
        "title": "Complete Blood Count",
        "patient": "Aarav Sharma",
        "date": "2023-10-15",
        "lines": [
            ("Hemoglobin", "11.2", "g/dL", "13.0-17.0"),
            ("WBC Count", "8500", "/cumm", "4000-11000"),
            ("Platelet Count", "220000", "/mcL", "150000-450000"),
            ("RBC Count", "4.2", "mil/mcL", "4.5-5.9")
        ]
    },
    {
        "filename": "Lipid_Profile",
        "title": "Lipid Panel",
        "patient": "Aarav Sharma",
        "date": "2023-10-20",
        "lines": [
            ("Total Cholesterol", "240", "mg/dL", "< 200"),
            ("Triglycerides", "180", "mg/dL", "< 150"),
            ("HDL Cholesterol", "35", "mg/dL", "> 40"),
            ("LDL Cholesterol", "169", "mg/dL", "< 100")
        ]
    },
    {
        "filename": "Metabolic_Panel",
        "title": "Comprehensive Metabolic Panel",
        "patient": "Aarav Sharma",
        "date": "2023-11-05",
        "lines": [
            ("Fasting Glucose", "135", "mg/dL", "70-99"),
            ("Serum Creatinine", "0.9", "mg/dL", "0.7-1.3"),
            ("BUN", "15", "mg/dL", "7-20"),
            ("Calcium", "9.2", "mg/dL", "8.5-10.2")
        ]
    },
    {
        "filename": "Thyroid_Test",
        "title": "Thyroid Function Test",
        "patient": "Aarav Sharma",
        "date": "2023-12-01",
        "lines": [
            ("TSH", "5.2", "uIU/mL", "0.4-4.0"),
            ("Free T3", "2.8", "pg/mL", "2.0-4.4"),
            ("Free T4", "1.0", "ng/dL", "0.8-1.8")
        ]
    },
    {
        "filename": "Vitamin_D",
        "title": "Vitamin Profile",
        "patient": "Aarav Sharma",
        "date": "2024-01-10",
        "lines": [
            ("Vitamin D (25-OH)", "15", "ng/mL", "30-100"),
            ("Vitamin B12", "350", "pg/mL", "200-900")
        ]
    }
]

for r in reports:
    create_report(r["filename"], r["title"], r["patient"], r["date"], r["lines"])
