"""Service for exporting data to Excel (XLSX) and Word (DOCX)."""

import io
import pandas as pd
from typing import List
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from app.models.niche import NicheResult
from app.models.channel import ChannelResult
from app.models.idea import VideoIdea
from app.models.video import VideoResult

# ==================== EXCEL EXPORT (XLSX) ====================

def export_niches_to_xlsx(niches: List[NicheResult]) -> io.BytesIO:
    """Export a list of niches to an Excel spreadsheet."""
    data = []
    for n in niches:
        data.append({
            "Name": n.name,
            "Category": n.category,
            "Competition": n.competition_level or "medium",
            "Viability Score": f"{n.score:.1f}/100",
            "Monetization": f"{n.monetization_score:.1f}/100",
            "Trends Score": f"{n.trends_score:.2f}x",
            "Description": n.description,
            "Created At": n.created_at.strftime("%Y-%m-%d") if n.created_at else "N/A"
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Niches")
        
        # Simple auto-sizing of columns
        worksheet = writer.sheets["Niches"]
        for idx, col in enumerate(df.columns):
            max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)

    output.seek(0)
    return output

def export_channels_to_xlsx(channels: List[ChannelResult]) -> io.BytesIO:
    """Export a list of channels to an Excel spreadsheet."""
    data = []
    for c in channels:
        data.append({
            "Title": c.title,
            "YouTube ID": c.youtube_id,
            "Subscribers": c.subscriber_count or 0,
            "Total Views": c.view_count or 0,
            "Videos": c.video_count or 0,
            "Growth Velocity (Views/Day)": f"{c.growth_velocity:.1f}" if c.growth_velocity else "0",
            "Opportunity Score": f"{c.opportunity_score:.1f}" if c.opportunity_score else "0",
            "Keywords": ", ".join(c.keywords) if c.keywords else "",
            "Description": c.description,
            "Last Fetched": c.fetched_at.strftime("%Y-%m-%d") if c.fetched_at else "N/A"
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Channels")
        
        # Simple auto-sizing of columns
        worksheet = writer.sheets["Channels"]
        for idx, col in enumerate(df.columns):
            max_len = max(df[col].astype(str).map(len).max(), len(col)) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)

    output.seek(0)
    return output

# ==================== WORD EXPORT (DOCX) ====================

def export_script_to_docx(idea: VideoIdea) -> io.BytesIO:
    """Format a video idea and script outline into a Word document."""
    doc = Document()
    
    # Title
    title_p = doc.add_heading(f"Script: {idea.title}", level=0)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Metadata Section
    doc.add_heading("Strategy & Metadata", level=1)
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.style = 'Table Grid'
    
    meta_table.cell(0, 0).text = "Target Niche"
    meta_table.cell(0, 1).text = idea.monetization_angle or "General"
    
    meta_table.cell(1, 0).text = "Primary Hook"
    meta_table.cell(1, 1).text = idea.hook or "N/A"
    
    meta_table.cell(2, 0).text = "Thumbnail Concept"
    meta_table.cell(2, 1).text = idea.thumbnail_concept or "N/A"
    
    meta_table.cell(3, 0).text = "SEO Keywords"
    meta_table.cell(3, 1).text = ", ".join(idea.keywords) if idea.keywords else "N/A"
    
    doc.add_paragraph() # Spacer
    
    # Script Outline
    doc.add_heading("Content Outline / Script", level=1)
    
    if idea.script_outline:
        for seg in idea.script_outline:
            # Segment Header
            h = doc.add_heading(seg.section.upper(), level=2)
            
            # Duration & Content
            p = doc.add_paragraph()
            if seg.duration_seconds:
                run = p.add_run(f"[{seg.duration_seconds}s] ")
                run.bold = True
                run.font.color.rgb = RGBColor(128, 128, 128)
            
            p.add_run(seg.content)
            
            # Visual Notes
            if seg.visual_notes:
                vn_p = doc.add_paragraph()
                vn_run = vn_p.add_run(f"Visual Notes: {seg.visual_notes}")
                vn_run.italic = True
                vn_run.font.color.rgb = RGBColor(0, 100, 200)

            # Retention
            if seg.retention_technique:
                rt_p = doc.add_paragraph()
                rt_run = rt_p.add_run(f"Retention Strategy: {seg.retention_technique}")
                rt_run.bold = True
                rt_run.font.color.rgb = RGBColor(0, 150, 0)
    else:
        # Fallback to talking points
        doc.add_paragraph("No full script outline available. Using talking points:")
        for tp in idea.talking_points:
            doc.add_paragraph(tp, style='List Bullet')

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output

def export_analysis_to_docx(video: VideoResult) -> io.BytesIO:
    """Format a forensic video analysis into a professional Word report."""
    doc = Document()
    analysis = video.video_analysis or {}
    
    # Header
    doc.add_heading("Forensic Video Analysis Report", level=0)
    doc.add_paragraph(f"Video Title: {video.title}")
    doc.add_paragraph(f"Views: {video.view_count:,} | Likes: {video.like_count:,}")
    
    # Hook Analysis
    doc.add_heading("1. Hook Analysis", level=1)
    h_type = analysis.get("hook_type", "Unknown")
    doc.add_paragraph(f"Hook Type: {h_type}").bold = True
    doc.add_paragraph(analysis.get("hook_analysis", "No analysis available."))
    
    # Emotion Triggers
    doc.add_heading("2. Emotion Triggers", level=1)
    triggers = analysis.get("emotion_triggers", [])
    if triggers:
        for t in triggers:
            p = doc.add_paragraph(style='List Bullet')
            p.add_run(f"{t.get('emotion')}: ").bold = True
            p.add_run(t.get("technique"))
            if t.get("intensity"):
                p.add_run(f" (Intensity: {t.get('intensity')}/10)").italic = True
    
    # Viral Factors
    doc.add_heading("3. Viral Formula", level=1)
    vf = analysis.get("viral_factors", {})
    doc.add_paragraph(vf.get("primary_reason", "N/A"))
    
    # Performance Signals
    doc.add_heading("4. Algorithm Signals", level=1)
    signals = vf.get("algorithm_signals", [])
    for sig in signals:
        doc.add_paragraph(sig, style='List Bullet')

    # Suggestions
    doc.add_heading("5. Strategic Recommendations", level=1)
    suggestions = analysis.get("improvement_suggestions", [])
    for sug in suggestions:
        doc.add_paragraph(sug, style='List Bullet')

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output
