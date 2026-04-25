import { getDoc } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

// Hàm lấy dữ liệu và tự động cập nhật trạng thái
export async function GET() {
  try {
    const doc = await getDoc();
    const historySheet = doc.sheetsByTitle['lich_su_dung_cu'];
    const masterRows = (await doc.sheetsByTitle['danh_muc_dung_cu'].getRows()).map(r => r.toObject());
    const rows = await historySheet.getRows();
    const now = new Date();

    for (const row of rows) {
      let changed = false;
      if (row.get('trang_thai') === 'DANG_TIET_KHUAN') {
        const endTime = new Date(row.get('thoi_gian_ket_thuc'));
        if (now >= endTime) {
          const master = masterRows.find(m => m.ten_bo_dung_cu === row.get('ten_bo_dung_cu'));
          const expiry = new Date(endTime.getTime() + (parseInt(master?.so_ngay_han || 7) * 86400000));
          row.set('trang_thai', 'HOAN_THANH_TIET_KHUAN');
          row.set('han_su_dung', expiry.toISOString());
          changed = true;
        }
      }
      if (changed) await row.save();
    }
    return NextResponse.json(rows.map(r => r.toObject()));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Hàm ghi dữ liệu mới
export async function POST(req) {
  const { action, payload } = await req.json();
  const doc = await getDoc();
  const historySheet = doc.sheetsByTitle['lich_su_dung_cu'];

  if (action === 'NHAN_MOI') {
    await historySheet.addRow({
      id: Date.now().toString(),
      thoi_gian: new Date().toLocaleString('vi-VN'),
      ten_bo_dung_cu: payload.ten_bo,
      trang_thai: 'DANG_XU_LY',
      nguoi_ban_giao: 'Điều dưỡng Khoa',
      nguoi_nhan: 'NV KSNK',
      tinh_trang: 'Đủ'
    });
  } else if (action === 'DONG_GOI' || action === 'TIET_KHUAN') {
    const rows = await historySheet.getRows();
    for (const id of payload.ids) {
      const row = rows.find(r => r.get('id') === id);
      if (row) {
        row.set('trang_thai', action === 'DONG_GOI' ? 'DONG_GOI' : 'DANG_TIET_KHUAN');
        if (action === 'TIET_KHUAN') {
          row.set('may', payload.may);
          row.set('thoi_gian_bat_dau', new Date().toISOString());
          row.set('thoi_gian_ket_thuc', new Date(Date.now() + payload.minutes * 60000).toISOString());
        }
        await row.save();
      }
    }
  }
  return NextResponse.json({ success: true });
}