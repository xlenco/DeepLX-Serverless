import axios from "https://cdn.skypack.dev/axios";
import { randomInt } from "https://deno.land/std@0.198.0/math/random.ts";

// DeepL API的基础URL和请求头设置
const DEEPL_BASE_URL = 'https://www2.deepl.com/jsonrpc';
const headers = {
  'Content-Type': 'application/json',
  Accept: '*/*',
  'x-app-os-name': 'iOS',
  'x-app-os-version': '16.3.0',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'x-app-device': 'iPhone13,2',
  'User-Agent': 'DeepL-iOS/2.9.1 iOS 16.3.0 (iPhone13,2)',
  'x-app-build': '510265',
  'x-app-version': '2.9.1',
  Connection: 'keep-alive',
};

// 计算文本中出现 "i" 字符的次数
function getICount(translateText: string) {
  return (translateText || '').split('i').length - 1;
}

// 生成随机数
function getRandomNumber() {
  return randomInt(8300000, 8399998) * 1000;
}

// 获取时间戳，并根据 "i" 的数量调整
function getTimestamp(iCount: number) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

// 主要翻译功能
export async function translate(
  text: string,
  sourceLang = 'AUTO',
  targetLang = 'ZH',
  alternativeCount = 0,
  printResult = false,
) {
  const iCount = getICount(text); // 获取 "i" 的数量
  const id = getRandomNumber();   // 获取随机数

  // 限制备选翻译结果的数量
  alternativeCount = Math.max(Math.min(3, alternativeCount), 0);

  // 构建请求数据
  const postData = {
    jsonrpc: '2.0',
    method: 'LMT_handle_texts',
    id: id,
    params: {
      texts: [{ text: text, requestAlternatives: alternativeCount }],
      splitting: 'newlines',
      lang: {
        source_lang_user_selected: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      },
      timestamp: getTimestamp(iCount),
    },
  };

  // 转换请求数据为JSON字符串
  let postDataStr = JSON.stringify(postData);

  // 根据条件对字符串进行处理
  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    postDataStr = postDataStr.replace('"method":"', '"method" : "');
  } else {
    postDataStr = postDataStr.replace('"method":"', '"method": "');
  }

  try {
    // 发送请求到DeepL API
    const response = await axios.post(DEEPL_BASE_URL, postDataStr, { headers: headers });

    if (response.status === 429) {
      throw new Error(`Too many requests, your IP has been blocked by DeepL temporarily, please don't request it frequently in a short time.`);
    }

    if (response.status !== 200) {
      console.error('Error', response.status);
      return;
    }

    // 解析和返回翻译结果
    const result = {
      text: response.data.result.texts[0].text,
      alternatives: response.data.result.texts[0].alternatives.map((alternative: any) => alternative.text)
    };
    if (printResult) {
      console.log(result);
    }
    return result;
  } catch (err) {
    console.error(err);
  }
}
