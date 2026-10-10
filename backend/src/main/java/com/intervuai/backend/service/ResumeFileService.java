package com.intervuai.backend.service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ResumeFileService {

    private static final int MAX_TEXT_LENGTH = 16000;

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a resume file to upload.");
        }

        String filename = file.getOriginalFilename();
        String extension = filename == null || !filename.contains(".")
                ? ""
                : filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);

        try {
            byte[] bytes = file.getBytes();
            String text = switch (extension) {
                case "txt" -> new String(bytes, StandardCharsets.UTF_8);
                case "pdf" -> extractPdf(bytes);
                case "docx" -> extractDocx(bytes);
                default -> throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Upload a PDF, DOCX, or TXT resume.");
            };

            text = text.replace("\u0000", "").trim();
            if (text.length() < 80) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "We could not find enough text in this file. Try a text-based PDF, DOCX, or TXT file.");
            }
            if (text.length() > MAX_TEXT_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The extracted resume is too long. Keep it to 16,000 characters or fewer.");
            }
            return text;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "We could not read this resume file. Make sure it is a valid, unprotected PDF, DOCX, or TXT file.");
        }
    }

    private String extractPdf(byte[] bytes) throws Exception {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String extractDocx(byte[] bytes) throws Exception {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
}
