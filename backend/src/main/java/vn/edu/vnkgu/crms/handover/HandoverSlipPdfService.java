package vn.edu.vnkgu.crms.handover;

import org.openpdf.text.Document;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.Image;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.pdf.BaseFont;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Renders a {@link HandoverSlip} to PDF with OpenPDF, matching spec §13 (mẫu phiếu
 * mượn/trả: tiêu đề, số phiếu/mã QR, người lập phiếu/người mượn, bảng CSVC, ô ký tên).
 * Ships its own DejaVu Sans TTF (resources/fonts) because OpenPDF's built-in fonts
 * can't render Vietnamese diacritics.
 */
@Service
public class HandoverSlipPdfService {

    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final QrCodeGenerator qrCodeGenerator;
    private final BaseFont baseFont;

    public HandoverSlipPdfService(QrCodeGenerator qrCodeGenerator) {
        this.qrCodeGenerator = qrCodeGenerator;
        this.baseFont = loadFont();
    }

    private BaseFont loadFont() {
        try {
            byte[] fontBytes = new ClassPathResource("fonts/DejaVuSans.ttf").getInputStream().readAllBytes();
            return BaseFont.createFont("DejaVuSans.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontBytes, null);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tải font DejaVuSans cho PDF", e);
        }
    }

    public byte[] generate(HandoverSlip slip) {
        Font titleFont = new Font(baseFont, 16, Font.BOLD);
        Font normalFont = new Font(baseFont, 11);
        Font smallFont = new Font(baseFont, 9);
        Font smallBoldFont = new Font(baseFont, 9, Font.BOLD);

        Document document = new Document(PageSize.A4, 40, 40, 50, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph org = new Paragraph("TRƯỜNG ĐẠI HỌC KIÊN GIANG — TRUNG TÂM HỘI NGHỊ", normalFont);
            org.setAlignment(Element.ALIGN_CENTER);
            document.add(org);

            Paragraph title = new Paragraph(
                    slip.getType() == HandoverType.BORROW ? "PHIẾU MƯỢN PHÒNG" : "PHIẾU TRẢ PHÒNG", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingBefore(6);
            title.setSpacingAfter(12);
            document.add(title);

            document.add(new Paragraph("Số phiếu: " + slip.getSlipNo(), normalFont));
            document.add(new Paragraph("Mã đơn: " + slip.getBooking().getCode(), normalFont));
            document.add(new Paragraph("Phòng: " + slip.getBooking().getRoom().getCode() + " — "
                    + slip.getBooking().getRoom().getName(), normalFont));
            document.add(new Paragraph("Thời gian mượn phòng: " + TIME_FORMAT.format(slip.getBooking().getStartTime())
                    + " — " + TIME_FORMAT.format(slip.getBooking().getEndTime()), normalFont));
            document.add(new Paragraph("Thời điểm bàn giao/trả: " + TIME_FORMAT.format(slip.getHandoverTime()), normalFont));
            document.add(new Paragraph("Người lập phiếu: " + slip.getCreatedBy().getFullName(), normalFont));
            document.add(new Paragraph("Người mượn: " + slip.getBorrowerName()
                    + (slip.getBorrowerUnit() != null ? " — " + slip.getBorrowerUnit() : "")
                    + (slip.getBorrowerPhone() != null ? " — ĐT: " + slip.getBorrowerPhone() : ""), normalFont));
            if (slip.getNote() != null && !slip.getNote().isBlank()) {
                document.add(new Paragraph("Ghi chú: " + slip.getNote(), normalFont));
            }

            document.add(new Paragraph(" "));

            String conditionColumnLabel = slip.getType() == HandoverType.BORROW
                    ? "Tình trạng bàn giao" : "Tình trạng khi trả";

            PdfPTable table = new PdfPTable(new float[]{0.6f, 3f, 1f, 1f, 1.6f, 2f});
            table.setWidthPercentage(100);
            addHeaderCell(table, "STT", smallBoldFont);
            addHeaderCell(table, "Tên cơ sở vật chất", smallBoldFont);
            addHeaderCell(table, "SL", smallBoldFont);
            addHeaderCell(table, "Trước đó", smallBoldFont);
            addHeaderCell(table, conditionColumnLabel, smallBoldFont);
            addHeaderCell(table, "Ghi chú", smallBoldFont);

            int stt = 1;
            for (HandoverItem item : slip.getItems()) {
                table.addCell(new Phrase(String.valueOf(stt++), smallFont));
                table.addCell(new Phrase(item.getItemName(), smallFont));
                table.addCell(new Phrase(String.valueOf(item.getQuantity()), smallFont));
                table.addCell(new Phrase(dash(item.getConditionBefore()), smallFont));
                table.addCell(new Phrase(dash(item.getConditionAfter()), smallFont));
                table.addCell(new Phrase(dash(item.getNote()), smallFont));
            }
            document.add(table);

            document.add(new Paragraph(" "));

            byte[] qrBytes = qrCodeGenerator.generatePng(slip.getSlipNo(), 140);
            Image qrImage = Image.getInstance(qrBytes);
            qrImage.setAlignment(Element.ALIGN_RIGHT);
            document.add(qrImage);

            document.add(new Paragraph(" "));
            document.add(new Paragraph(" "));

            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            sigTable.addCell(signatureCell("NGƯỜI LẬP PHIẾU\n(Ký, ghi rõ họ tên)", normalFont));
            sigTable.addCell(signatureCell("NGƯỜI MƯỢN\n(Ký, ghi rõ họ tên)", normalFont));
            document.add(sigTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo PDF phiếu " + slip.getSlipNo(), e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(new java.awt.Color(230, 230, 230));
        table.addCell(cell);
    }

    private PdfPCell signatureCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(0);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setFixedHeight(90);
        return cell;
    }

    private String dash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
