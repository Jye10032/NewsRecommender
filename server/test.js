import bcrypt from 'bcrypt';

const plainText = 'default_password'; // 要加密的字符串

// 加密字符串
bcrypt.hash(plainText, 10, (err, hash) => {
    if (err) {
        console.error('加密失败：', err);
    } else {
        console.log('加密后的结果：', hash);
    }
});


console.log(plainText);