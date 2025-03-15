import React, { useState, useEffect, useRef, useCallback } from 'react'; // 从 react 包中导入所需的 Hook
import ReactDOM from 'react-dom'; // 从 react-dom 包中导入 ReactDOM
import MonacoEditor from '@monaco-editor/react'; // 导入 MonacoEditor 组件用于代码编辑
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react'; // 从 lucide-react 包中导入图标组件

// CodeEditor 组件定义
const CodeEditor = ({
    code, // 代码内容
    setCode, // 设置代码内容的函数
    handleEditorWillMount, // 编辑器即将挂载时的处理函数
    handleEditorDidMount, // 编辑器挂载完成后的处理函数
    handleEditorChange // 编辑器内容变化时的处理函数
}) => {
    return (
        <div className="mb-6 border-blue-400"> {/* 容器，带有底部边距和蓝色边框 */}
            <MonacoEditor
                height="64vh" // 编辑器高度
                defaultLanguage="javascript" // 默认编程语言
                value={code} // 编辑器初始值
                onChange={handleEditorChange} // 内容变化时的回调函数
                beforeMount={handleEditorWillMount} // 编辑器挂载前的回调函数
                onMount={handleEditorDidMount} // 编辑器挂载后的回调函数
                theme="myTheme" // 编辑器主题
                options={{ // 编辑器配置选项
                    selectOnLineNumbers: true, // 允许通过点击行号选择整行
                    automaticLayout: true, // 自动布局
                    minimap: { // 缩略图配置
                        enabled: false // 禁用缩略图
                    },
                    wordWrap: 'wordWrapColumn', // 自动换行模式
                    wordWrapColumn: 80, // 换行列数
                    wrappingIndent: 'indent', // 换行缩进
                    lineNumbers: 'on', // 显示行号
                    fontSize: 14, // 字体大小
                    fontFamily: 'monospace', // 字体类型
                    scrollBeyondLastLine: false, // 不允许滚动超过最后一行
                    glyphMargin: false, // 不显示字形边距
                    lineDecorationsWidth: 20, // 行装饰宽度
                    folding: true, // 启用代码折叠
                    showFoldingControls: 'mouseover', // 鼠标悬停时显示折叠控件
                    renderLineHighlight: 'line', // 行高亮模式
                    cursorBlinking: 'blink', // 光标闪烁
                    cursorSmoothCaretAnimation: true, // 平滑光标动画
                    cursorStyle: 'line', // 光标样式
                    roundedSelection: true, // 圆角选择
                    suggestOnTriggerCharacter: true, // 触发字符时显示建议
                    tabSize: 2, // 制表符大小
                    insertSpaces: true, // 插入空格
                    detectIndentation: true, // 自动检测缩进
                    quickSuggestions: true, // 快速建议
                    snippetSuggestions: 'top', // 代码片段建议位置
                    showUnused: true, // 显示未使用的代码
                    parameterHints: true, // 参数提示
                    codeLens: false, // 关闭代码镜头
                    formatOnType: false, // 不在打字时格式化
                    formatOnPaste: false, // 不在粘贴时格式化
                }}
            />
        </div>
    );
};

export default CodeEditor; // 导出 CodeEditor 组件