package vn.edu.vnkgu.crms.asset;

import vn.edu.vnkgu.crms.asset.dto.AssetDto;
import vn.edu.vnkgu.crms.asset.dto.AssetRequest;
import vn.edu.vnkgu.crms.common.ConflictException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.room.Room;
import vn.edu.vnkgu.crms.room.RoomRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AssetService {

    private final AssetRepository assetRepository;
    private final RoomRepository roomRepository;

    public AssetService(AssetRepository assetRepository, RoomRepository roomRepository) {
        this.assetRepository = assetRepository;
        this.roomRepository = roomRepository;
    }

    public List<AssetDto> listByRoom(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw NotFoundException.of("Phòng", roomId);
        }
        return assetRepository.findByRoomIdOrderByNameAsc(roomId).stream().map(AssetDto::from).toList();
    }

    public AssetDto get(Long id) {
        return AssetDto.from(getEntity(id));
    }

    @Transactional
    public AssetDto create(Long roomId, AssetRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> NotFoundException.of("Phòng", roomId));
        if (assetRepository.existsByAssetCode(request.assetCode())) {
            throw new ConflictException("Mã tài sản đã tồn tại: " + request.assetCode());
        }
        Asset asset = new Asset();
        asset.setRoom(room);
        applyRequest(asset, request);
        return AssetDto.from(assetRepository.save(asset));
    }

    @Transactional
    public AssetDto update(Long id, AssetRequest request) {
        Asset asset = getEntity(id);
        if (assetRepository.existsByAssetCodeAndIdNot(request.assetCode(), id)) {
            throw new ConflictException("Mã tài sản đã tồn tại: " + request.assetCode());
        }
        applyRequest(asset, request);
        // saveAndFlush (not save): @UpdateTimestamp only populates updatedAt when the
        // UPDATE actually executes, which Hibernate would otherwise defer to commit time,
        // after this method — and the DTO below — has already been built.
        return AssetDto.from(assetRepository.saveAndFlush(asset));
    }

    @Transactional
    public void delete(Long id) {
        assetRepository.delete(getEntity(id));
    }

    /** F-ROOM-04: kiểm kê nhanh — xuất danh sách tài sản theo phòng ra Excel. */
    public byte[] exportByRoom(Long roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> NotFoundException.of("Phòng", roomId));
        List<Asset> assets = assetRepository.findByRoomIdOrderByNameAsc(roomId);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Kiem ke - " + room.getCode());
            Row header = sheet.createRow(0);
            String[] columns = {"Mã tài sản", "Tên tài sản", "Danh mục", "Số lượng", "Đơn vị tính",
                    "Tình trạng", "Năm mua", "Di động", "Ghi chú"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            int r = 1;
            for (Asset asset : assets) {
                Row row = sheet.createRow(r++);
                int c = 0;
                row.createCell(c++).setCellValue(asset.getAssetCode());
                row.createCell(c++).setCellValue(asset.getName());
                row.createCell(c++).setCellValue(nullToEmpty(asset.getCategory()));
                row.createCell(c++).setCellValue(asset.getQuantity());
                row.createCell(c++).setCellValue(nullToEmpty(asset.getUnit()));
                row.createCell(c++).setCellValue(asset.getCondition());
                row.createCell(c++).setCellValue(asset.getPurchaseYear() != null ? asset.getPurchaseYear() : 0);
                row.createCell(c++).setCellValue(asset.isMovable() ? "Có" : "Không");
                row.createCell(c).setCellValue(nullToEmpty(asset.getNote()));
            }
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể xuất kiểm kê tài sản", e);
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private Asset getEntity(Long id) {
        return assetRepository.findById(id).orElseThrow(() -> NotFoundException.of("Tài sản", id));
    }

    private void applyRequest(Asset asset, AssetRequest request) {
        asset.setAssetCode(request.assetCode());
        asset.setName(request.name());
        asset.setCategory(request.category());
        asset.setQuantity(request.quantity() != null ? request.quantity() : 1);
        asset.setUnit(request.unit());
        asset.setCondition(request.condition() != null ? request.condition() : "GOOD");
        asset.setPurchaseYear(request.purchaseYear());
        asset.setMovable(Boolean.TRUE.equals(request.movable()));
        asset.setNote(request.note());
    }
}
