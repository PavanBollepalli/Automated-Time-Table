from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
import pandas as pd
from io import BytesIO
from app.models.timetable import Timetable

class ExportService:
    @staticmethod
    def to_excel(timetable: Timetable) -> BytesIO:
        data = []
        for entry in timetable.entries:
            data.append({
                "Day": entry.day,
                "Period": entry.period,
                "Course": entry.course_name,
                "Faculty": entry.faculty_name,
                "Room": entry.room_name
            })
        
        df = pd.DataFrame(data)
        pivot = df.pivot(index=["Day"], columns=["Period"], values="Course") # Simplistic view
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name="Raw Data")
            pivot.to_excel(writer, sheet_name="Grid View")
        output.seek(0)
        return output

    @staticmethod
    def to_pdf(timetable: Timetable) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        
        # Prepare data for Table
        data = [["Day", "Period", "Course", "Faculty", "Room"]]
        for entry in timetable.entries:
            data.append([
                entry.day,
                str(entry.period),
                entry.course_name,
                entry.faculty_name,
                entry.room_name
            ])
            
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(t)
        doc.build(elements)
        buffer.seek(0)
        return buffer
