/**
 * Vietnamese strings — the default and only locale for P0/P1.
 * Structured as a flat dictionary keyed by feature area so an `en.ts` sibling
 * (plus a tiny lookup-by-current-locale hook) can be added later without
 * reshaping call sites.
 */
export const vi = {
  common: {
    save: "Lưu",
    cancel: "Hủy",
    edit: "Sửa",
    delete: "Xóa",
    add: "Thêm",
    search: "Tìm kiếm",
    confirmDeleteTitle: "Xác nhận xóa",
    loading: "Đang tải...",
    actions: "Thao tác",
  },
  auth: {
    loginTitle: "Đăng nhập quản trị",
    username: "Tên đăng nhập",
    password: "Mật khẩu",
    loginButton: "Đăng nhập",
    loginFailed: "Đăng nhập thất bại",
    logout: "Đăng xuất",
  },
  rooms: {
    title: "Quản lý phòng",
    code: "Mã phòng",
    name: "Tên phòng",
    building: "Tòa nhà",
    floor: "Tầng",
    capacity: "Sức chứa",
    areaM2: "Diện tích (m²)",
    description: "Mô tả",
    status: "Trạng thái",
    addRoom: "Thêm phòng",
    editRoom: "Sửa phòng",
    manageAssets: "Quản lý tài sản",
  },
  assets: {
    title: "Tài sản trong phòng",
    assetCode: "Mã tài sản",
    name: "Tên tài sản",
    category: "Danh mục",
    quantity: "Số lượng",
    unit: "Đơn vị tính",
    condition: "Tình trạng",
    purchaseYear: "Năm mua",
    movable: "Di động",
    note: "Ghi chú",
    addAsset: "Thêm tài sản",
    editAsset: "Sửa tài sản",
  },
};

export type Dictionary = typeof vi;
