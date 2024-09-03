import axios from "https://cdn.skypack.dev/axios";

// DeepL API 基础 URL 和请求头配置
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

// 计算文本中 'i' 字母的个数
function getICount(translateText: string) {
  return (translateText || '').split('i').length - 1;
}

// 生成随机数的方法
function getRandomNumber() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % (8399998 - 8300000 + 1) + 8300000 * 1000;
}

// 根据 'i' 字母个数计算时间戳
function getTimestamp(iCount: number) {
  const ts = Date.now();
  if (iCount === 0) {
    return ts;
  }
  iCount++;
  return ts - (ts % iCount) + iCount;
}

// 翻译函数，调用 DeepL API
export async function translate(
  text: string,
  sourceLang = 'AUTO',
  targetLang = 'ZH',
  alternativeCount = 0,
  printResult = false,
) {
  const iCount = getICount(text);
  const id = getRandomNumber();

  alternativeCount = Math.max(Math.min(3, alternativeCount), 0);

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

  let postDataStr = JSON.stringify(postData);

  if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
    postDataStr = postDataStr.replace('"method":"', '"method" : "');
  } else {
    postDataStr = postDataStr.replace('"method":"', '"method": "');
  }

  try {
    const response = await axios.post(DEEPL_BASE_URL, postDataStr, { headers: headers });

    if (response.status === 429) {
      throw new Error(`Too many requests, your IP has been blocked by DeepL temporarily, please don't request it frequently in a short time.`);
    }

    if (response.status !== 200) {
      console.error('Error', response.status);
      return;
    }

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