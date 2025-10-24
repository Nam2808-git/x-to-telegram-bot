import axios from 'axios';

const BEARER_TOKEN = 'your_twitter_bearer_token'; // Thay bằng process.env.TWITTER_BEARER_TOKEN
const TELEGRAM_TOKEN = 'your_telegram_bot_token';  // Thay bằng process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = 'your_telegram_chat_id'; // Thay bằng process.env.TELEGRAM_CHAT_ID
const TWITTER_USERNAME = 'elonmusk';              // Thay bằng process.env.TWITTER_USERNAME

let lastTweetId = '0';

async function getLatestTweets() {
  try {
    const url = `https://api.twitter.com/2/users/by/username/${TWITTER_USERNAME}`;
    const userRes = await axios.get(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    });
    const userId = userRes.data.data.id;

    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at`;
    const tweetsRes = await axios.get(tweetsUrl, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    });
    return tweetsRes.data.data || [];
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return [];
  }
}

async function sendToTelegram(text, url) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: TELEGRAM_CHAT_ID,
    text: `${text}\n\n🔗 ${url}`,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
}

async function checkNewTweets() {
  const tweets = await getLatestTweets();
  if (tweets.length > 0) {
    // Sắp xếp theo id giảm dần để lấy tweet mới nhất
    const latestTweet = tweets.reduce((newest, current) => 
      BigInt(newest.id) > BigInt(current.id) ? newest : current
    );
    
    // Chỉ gửi nếu tweet mới hơn lastTweetId
    if (BigInt(latestTweet.id) > BigInt(lastTweetId)) {
      const text = latestTweet.text.length > 200 
        ? latestTweet.text.substring(0, 200) + '...' 
        : latestTweet.text;
      const url = `https://x.com/${TWITTER_USERNAME}/status/${latestTweet.id}`;
      await sendToTelegram(text.replace(/&/g, '&amp;'), url);
      console.log(`Sent tweet: ${url}`);
      lastTweetId = latestTweet.id; // Cập nhật lastTweetId ngay sau khi gửi
    }
  }
}

// Kiểm tra mỗi 10 giây
setInterval(checkNewTweets, 10000);
checkNewTweets(); // Chạy ngay lần đầu
