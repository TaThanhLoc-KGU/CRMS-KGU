package vn.edu.vnkgu.crms.common.preview;

import vn.edu.vnkgu.crms.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Converts Office documents to PDF via Gotenberg (LibreOffice route) so they can be
 * previewed inline in the browser the same way a native PDF is — see spec §11.
 */
@Service
public class PreviewConversionService {

    private static final Logger log = LoggerFactory.getLogger(PreviewConversionService.class);

    private final RestClient restClient;

    public PreviewConversionService(@Value("${app.gotenberg.url}") String gotenbergUrl) {
        this.restClient = RestClient.builder().baseUrl(gotenbergUrl).build();
    }

    public byte[] convertToPdf(byte[] content, String fileName) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("files", new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return fileName;
            }
        });

        try {
            byte[] pdf = restClient.post()
                    .uri("/forms/libreoffice/convert")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(byte[].class);
            if (pdf == null || pdf.length == 0) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Gotenberg trả về file rỗng");
            }
            return pdf;
        } catch (Exception ex) {
            log.warn("Gotenberg conversion failed for {}: {}", fileName, ex.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Không thể tạo bản xem nhanh cho file: " + fileName);
        }
    }
}
