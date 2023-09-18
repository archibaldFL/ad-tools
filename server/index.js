const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');

// import express from 'express';
// import multer from 'multer';
// import XLSX from 'xlsx';
// import cors from 'cors';

exports.startServer =  (port)=>{
    const app = express();
    let options = {
        dotfiles: 'ignore',
        etag: false,
        extensions: ['htm', 'html'],
        index: false,
        maxAge: '1d',
        redirect: false,
        setHeaders: function (res, path, stat) {
            res.set('x-timestamp', Date.now())
        }
    }

    app.use(express.static(__dirname,options))

// 开启跨域
    app.use(cors())

    const upload = multer({storage: multer.memoryStorage()});

    let dataMap = new Map();

// 上传文件接口
    app.post('/upload', upload.single('file'), (req, res) => {
        // 获取文件
        const file = req.file;
        // 上传文件的缓冲区数据，并创建一个Excel工作簿对象。
        const workbook = XLSX.read(file.buffer, {type: 'buffer'});

        // 获取工作簿中的第一个工作表。
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        // 转换为json对象
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        dataMap = new Map()
        // 将数据转化为对象
        jsonData.forEach(row => {
            const keys = Object.keys(row);
            const key = row[keys[0]];
            dataMap.set(key.toString().trim(), row);
        });

        res.json({count: dataMap.size});
    });

// 获取数据接口
    app.get('/:key', (req, res) => {
        const {key} = req.params;
        const value = dataMap.get(key);
        res.json(value);
    });

    port = port ? port : 3000;
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}


