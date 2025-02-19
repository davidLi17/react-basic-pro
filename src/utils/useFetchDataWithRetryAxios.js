import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetchDataWithRetryAxios = (url, timeout = 5000, maxRetries = 3, retryDelay = 1000) => {
    const [data, setData] = useState(null); // 修改初始值为 null，更通用
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let retryCount = 0;
        const source = axios.CancelToken.source(); // 用于取消请求

        const fetchDataWithRetry = async () => {
            setLoading(true);
            setError(null); // 清除之前的错误

            while (retryCount < maxRetries) {
                try {
                    const response = await axios.get(url, {
                        timeout: timeout,
                        cancelToken: source.token, // 关联取消 token
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    setData(response.data);
                    console.log('In useFetchDataWithRetryAxios.js response.data::: ', response.data);
                    setLoading(false);
                    return; // 请求成功，退出重试循环

                } catch (e) {
                    if (axios.isCancel(e)) {
                        // 请求被手动取消 (例如组件卸载)
                        console.log("useFetchDataWithRetryAxios:请求被取消");
                        setLoading(false);
                        return;
                    }

                    if (e.code === 'ECONNABORTED') { // Axios 超时错误代码
                        console.log(`请求超时, 重试第 ${retryCount + 1} 次`);
                        retryCount++;
                        if (retryCount >= maxRetries) {
                            setError(new Error('请求超时，超出最大重试次数'));
                            setLoading(false);
                            return; // 达到最大重试次数，退出
                        }
                        await new Promise(resolve => setTimeout(resolve, retryDelay)); // 延迟重试
                    } else {
                        setError(e);
                        setLoading(false);
                        return; // 非超时错误，退出
                    }
                }
            }
        };

        fetchDataWithRetry();

        return () => {
            source.cancel('组件卸载，取消请求'); // 组件卸载时取消请求
        };
    }, [url, timeout, maxRetries, retryDelay]); // 依赖项包含重试参数

    return { data, loading, error };
};

export default useFetchDataWithRetryAxios;