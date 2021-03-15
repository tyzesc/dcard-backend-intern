// 限制每小時來自同一個 IP 的請求數量不得超過 1000
// 在 response headers 中加入剩餘的請求數量 (X-RateLimit-Remaining) 以及 rate limit 歸零的時間 (X-RateLimit-Reset)
// 如果超過限制的話就回傳 429 (Too Many Requests)
// 可以使用各種資料庫達成

const express = require('express')
const app = express()
const port = process.env.port | 3000

const redis = require("redis")
const client = redis.createClient()

const ratelimit = 1000
const windowSec = 1 * 60 * 60


app.use('/draw', (req, res, next) => {
    const { ip } = req
    if (ip == undefined) throw new Error("has no ip")

    try {
        client.incr(ip, (err, reply) => {
            if (reply <= 1) {
                client.expire(ip, windowSec)
            }

            const remaining = ratelimit - reply
            if (remaining < 0) {
                console.log(`[m] ${ip} has too many request...`)
                return res.sendStatus(429)
            }
            res.setHeader("X-RateLimit-Remaining", remaining)

            console.log(`[m] ${ip} connecting, remaining ${remaining}`)

            client.ttl(ip, (err, reply) => {
                res.setHeader("X-RateLimit-Reset", Math.max(0, reply))
                next()
            })
        })
    } catch (error) {
        return res.sendStatus(500);
    }
})

app.get('/draw', (req, res) => {
    console.log(`[*] <<< ${req.ip}`)
    res.json({ "matched": [], "wishCountdown": 0, "accept": false, "bothAccept": false, "memberId": 0, "matchedAt": "2021-03-15T00:00:00.000Z", "dcard": { "gender": "M", "department": "電機工程研究所", "school": "國立臺灣海洋大學", "grade": "畢業", "talent": "畫畫，拍照，運動，寵物", "club": "", "lecture": "", "lovedCountry": "Japan", "trouble": "累", "wantToTry": " ", "exchange": "畫畫，拍照", "workExperience": "", "bloodType": "", "avatar": "https://upload.wikimedia.org/wikipedia/commons/f/f8/Dcard_Favicon_x520.png" } })
})

app.listen(port, () => {
    console.log(`server is on ${port}`)
})