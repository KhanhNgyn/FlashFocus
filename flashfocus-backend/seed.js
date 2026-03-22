const mongoose = require('mongoose');
const Deck = require('./models/Deck');
const Card = require('./models/Card');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';

const seedData = async () => {
    try {
        console.log('Đang kết nối tới MongoDB...');
        await mongoose.connect(MONGO_URI);
        
        // Xóa dữ liệu cũ để tránh trùng lặp khi chạy nhiều lần
        await Deck.deleteMany({});
        await Card.deleteMany({});
        console.log('Đã làm sạch dữ liệu cũ.');

        // Tạo bộ thẻ mới
        const deck1 = await Deck.create({ title: 'Giao tiếp Tiếng Anh cơ bản' });
        const deck2 = await Deck.create({ title: 'Từ vựng React Native' });
        const deck3 = await Deck.create({ title: 'Lịch sử Việt Nam' });

        // Tạo thẻ học cho bộ 1
        await Card.create([
            { deck_id: deck1._id, front: 'How are you?', back: 'Bạn khỏe không?' },
            { deck_id: deck1._id, front: 'Nice to meet you', back: 'Rất vui được gặp bạn' },
            { deck_id: deck1._id, front: 'Thank you very much', back: 'Cảm ơn bạn rất nhiều' }
        ]);

        // Tạo thẻ học cho bộ 2
        await Card.create([
            { deck_id: deck2._id, front: 'JSX là gì?', back: 'JavaScript XML - cú pháp mở rộng cho JS' },
            { deck_id: deck2._id, front: 'Props vs State', back: 'Props là dữ liệu truyền vào, State là dữ liệu nội bộ' },
            { deck_id: deck2._id, front: 'useEffect dùng làm gì?', back: 'Xử lý side effects (gọi API, subscription...)' }
        ]);

        // Tạo thẻ học cho bộ 3
        await Card.create([
            { deck_id: deck3._id, front: 'Chiến thắng Điện Biên Phủ năm nào?', back: '1954' },
            { deck_id: deck3._id, front: 'Tuyên ngôn độc lập đọc tại đâu?', back: 'Quảng trường Ba Đình' }
        ]);

        console.log('---------------------------------');
        console.log('✅ Đã thêm 3 bộ thẻ và 8 thẻ học mẫu!');
        console.log('🚀 Bạn có thể mở App để thấy dữ liệu mới.');
    } catch (err) {
        console.error('❌ Lỗi khi thêm dữ liệu:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedData();
