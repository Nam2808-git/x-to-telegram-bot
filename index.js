import axios from 'axios';
import translate from 'google-translate-api';

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || 'your_twitter_bearer_token';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'your_telegram_chat_id';
const TWITTER_USERNAME = process.env.TWITTER_USERNAME || 'Binance Alpha';

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
    if (error.response && error.response.status === 429) {
      console.error('Rate limit exceeded. Waiting 15 minutes before retrying...');
      await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000)); // Chờ 15 phút
      return getLatestTweets(); // Thử lại
    }
    console.error('Error fetching tweets:', error.message);
    return [];
  }
}

async function sendToTelegram(text, url) {
  try {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      text: `${text}\n\ ${url}`,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });
  } catch (error) {
    console.error('Error sending to Telegram:', error.message);
  }
}

async function translateText(text) {
  try {
    const res = await translate(text, { from: 'en', to: 'vi' });
    return res.text;
  } catch (error) {
    console.error('Error translating text:', error.message);
    return text; // Trả về text gốc nếu dịch thất bại
  }
}

async function checkNewTweets() {
  const tweets = await getLatestTweets();
  if (tweets.length > 0) {
    const latestTweet = tweets.reduce((newest, current) => 
      BigInt(newest.id) > BigInt(current.id) ? newest : current
    );
    
    if (BigInt(latestTweet.id) > BigInt(lastTweetId)) {
      const originalText = latestTweet.text.length > 200 
        ? latestTweet.text.substring(0, 200) + '...' 
        : latestTweet.text;
      
      // Kiểm tra nếu chứa "Binance Alpha" (không phân biệt hoa thường)
      if (originalText.toLowerCase().includes('binance alpha')) {
        const translatedText = await translateText(originalText);
        const url = `https://x.com/${TWITTER_USERNAME}/status/${latestTweet.id}`;
        await sendToTelegram(translatedText, url);
        console.log(`Sent translated tweet: ${url}`);
        lastTweetId = latestTweet.id;
      }
    }
  }
}

setInterval(checkNewTweets, 60000); // 60 giây
checkNewTweets(); // Chạy ngay lần đầu
