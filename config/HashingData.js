const crypto = require('crypto');
require('dotenv').config();
function encrypt(text,key) {
    const iv = crypto.randomBytes(16); // Tạo initialization vector (IV) ngẫu nhiên
    const hashKey = crypto.createHash('sha256').update(key).digest(); // Chuyển đổi chuỗi khóa thành buffer 32 byte
    const cipher = crypto.createCipheriv('aes-256-cbc', hashKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex'); // Trả về IV và dữ liệu mã hóa dưới dạng hex
  }
  
function decrypt(text,key) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const hashKey = crypto.createHash('sha256').update(key).digest(); // Chuyển đổi chuỗi khóa thành buffer 32 byte
    const decipher = crypto.createDecipheriv('aes-256-cbc', hashKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
module.exports = {encrypt,decrypt};