import React, { useRef, useEffect } from 'react';

function MyComponent() {
    const inputElement = useRef(null); // 初始化 ref 为 null

    useEffect(() => {
        // 组件挂载后，inputElement.current 将指向 input DOM 节点
        if (inputElement.current) {
            inputElement.current.focus(); // 例如，让 input 元素自动聚焦
        }
    }, []); // 空依赖数组确保 effect 只在组件挂载后执行一次

    return (
        <input placeholder='我是被获取Dom的Input' type="text" ref={inputElement} />
    );
}
export default MyComponent;