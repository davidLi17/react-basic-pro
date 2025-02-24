import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import MonacoEditor from '@monaco-editor/react';
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';

const EventLoopVisualizer = () => {
    const editorRef = useRef(null);
    function handleEditorWillMount(monaco) {
        // 在编辑器挂载前执行
        // 设置 JavaScript 的即时同步功能
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    }
    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;

        monaco.editor.defineTheme('myTheme', {
            base: 'vs-dark', // 可选基础主题: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
            inherit: true,   // 是否继承基础主题的规则
            rules: [
                // 语法高亮规则
                { token: 'comment', foreground: '6A9955' },           // 注释
                { token: 'string', foreground: 'CE9178' },           // 字符串
                { token: 'keyword', foreground: '569CD6' },          // 关键字
                { token: 'number', foreground: 'B5CEA8' },           // 数字
                { token: 'regexp', foreground: 'D16969' },           // 正则
                { token: 'type', foreground: '4EC9B0' },             // 类型
                { token: 'function', foreground: 'DCDCAA' },         // 函数
                { token: 'variable', foreground: '9CDCFE' },         // 变量
                { token: 'operator', foreground: 'D4D4D4' }          // 运算符
            ],
            colors: {
                // 编辑器颜色配置
                'editor.background': '#1E1E1E',                      // 背景色
                'editor.foreground': '#D4D4D4',                      // 前景色
                'editor.lineHighlightBackground': '#2F3337',         // 当前行高亮
                'editor.selectionBackground': '#264F78',             // 选中文本背景
                'editor.inactiveSelectionBackground': '#3A3D41',     // 非活动选中背景
                'editorCursor.foreground': '#AEAFAD',               // 光标颜色
                'editorLineNumber.foreground': '#858585',           // 行号颜色
                'editorLineNumber.activeForeground': '#C6C6C6',     // 当前行号颜色
                'editor.findMatchBackground': '#515C6A',            // 查找匹配背景
                'editor.findMatchHighlightBackground': '#3A3D41',   // 查找高亮背景
                'editorBracketMatch.background': '#0D3A58',         // 括号匹配背景
                'editorBracketMatch.border': '#216F9C',            // 括号匹配边框
                'editorGutter.background': '#1E1E1E',              // 行号背景
                'editorWidget.background': '#252526',              // 小部件背景(如建议)
                'editorSuggestWidget.background': '#252526',       // 建议窗口背景
                'editorSuggestWidget.border': '#454545',          // 建议窗口边框
                'editorSuggestWidget.foreground': '#D4D4D4',      // 建议窗口前景色
                'editorSuggestWidget.selectedBackground': '#094771' // 建议窗口选中项背景
            }
        });
        monaco.editor.setTheme('myTheme');

        // 添加代码提示
        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: () => {
                return {
                    suggestions: [
                        {
                            label: 'console.log',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: 'console.log($1)',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                        }
                    ]
                };
            }
        });

        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                // Ctrl+S 保存代码并格式化
                const formatAction = editor.getAction('editor.action.formatDocument');
                if (formatAction) {
                    formatAction.run()
                        .then(() => {
                            console.log('代码已格式化并保存:');
                            // 在格式化完成后，你可以执行保存代码的逻辑
                            // 例如，如果你有保存代码到服务器或本地存储的逻辑，可以在这里调用
                        })
                        .catch(error => {
                            console.error('格式化代码失败:', error);
                        });
                } else {
                    console.log('格式化 Action 未找到，仅保存代码:', editor.getValue());
                    // 如果格式化 Action 未找到，你仍然可以执行保存代码的逻辑
                }
            }
        );
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            // Ctrl+Enter 运行代码
            handleRun();
        });
    }
    function handleEditorChange(value, event) {
        setCode(value);
    }
    // 代码编辑器状态，存储用户输入的 JavaScript 代码
    const [code, setCode] = useState(
        `console.log('1 - 同步任务');
     setTimeout(() => {
        console.log('2 - 宏任务 setTimeout (延迟 0ms)');
        Promise.resolve().then(() => {
            console.log('3 - 微任务 Promise.then (在宏任务 setTimeout 中)');
        });
    }, 0);
    new Promise(resolve => {
        console.log('4 - 同步任务 Promise 构造函数');
        resolve();
    }).then(() => {
        console.log('5 - 微任务 Promise.then (初始 Promise)');

        setTimeout(() => {
            console.log('6 - 宏任务 setTimeout (在微任务 Promise.then 中)');
        }, 0);
    });
    console.log('7 - 同步任务');`
    );

    // 任务队列状态，用于存储同步任务
    const [taskQueue, setTaskQueue] = useState([]);
    // 微任务队列状态，用于存储微任务
    const [microTaskQueue, setMicroTaskQueue] = useState([]);
    // 宏任务队列状态，用于存储宏任务
    const [macroTaskQueue, setMacroTaskQueue] = useState([]);
    // 控制台输出状态，存储 console.log 的内容
    const [consoleOutput, setConsoleOutput] = useState([]);
    // 运行状态，指示代码是否正在执行
    const [isRunning, setIsRunning] = useState(false);


    // 创建安全执行上下文的函数，用于模拟浏览器环境，并捕获任务和输出
    const createSafeExecutionContext = () => {
        const tasks = []; // 存储同步任务
        const microtasks = []; // 存储微任务
        const macrotasks = []; // 存储宏任务
        const outputs = []; // 存储控制台输出

        // 重写 console.log 方法，捕获控制台输出和同步任务
        const mockConsole = {
            log: (...args) => {
                outputs.push({ // 记录控制台输出
                    type: 'log',
                    content: args.join(' '), // 将参数连接成字符串
                    timestamp: Date.now() // 记录时间戳
                });
                tasks.push({ // 记录同步任务
                    type: 'sync',
                    content: `console.log(${args.join(', ')})`, // 记录代码内容
                    output: args.join(' ') // 记录输出内容
                });
            }
        };

        // 使用原生的 Promise 并增强
        const MockPromise = function (executor) {
            const realPromise = new Promise(executor); // Use native Promise

            realPromise.then = function (onFulfilled, onRejected) {
                const thenPromise = Promise.prototype.then.call(realPromise, onFulfilled, onRejected);
                microtasks.push({
                    type: 'micro',
                    content: 'Promise.then() - callback enqueued',
                    output: undefined
                });
                return thenPromise;
            };

            realPromise.catch = function (onRejected) {
                const catchPromise = Promise.prototype.catch.call(realPromise, onRejected);
                microtasks.push({
                    type: 'micro',
                    content: 'Promise.catch() - callback enqueued',
                    output: undefined
                });
                return catchPromise;
            };
            return realPromise;
        };

        // Attach static methods from native Promise to MockPromise
        MockPromise.resolve = Promise.resolve;
        MockPromise.reject = Promise.reject;
        MockPromise.all = Promise.all;
        MockPromise.race = Promise.race;
        // ... you can add other static methods if needed


        // 重写 setTimeout 函数，捕获宏任务
        const mockSetTimeout = (callback, delay) => {
            macrotasks.push({ // 记录 setTimeout 宏任务
                type: 'macro',
                content: `setTimeout(..., ${delay}) - callback enqueued`,
                output: undefined
            });
            return setTimeout(callback, delay); // 调用原生的 setTimeout
        };

        // 返回 mock 后的 context 和任务队列
        return {
            context: { // mock 后的全局 context
                console: mockConsole, // 使用 mock 的 console
                Promise: MockPromise, // 使用 mock 的 Promise
                setTimeout: mockSetTimeout // 使用 mock 的 setTimeout
            },
            tasks, // 同步任务队列
            microtasks, // 微任务队列
            macrotasks, // 宏任务队列
            outputs // 控制台输出队列
        };
    };

    // 执行代码的函数
    const executeCode = () => {
        // 创建安全执行上下文
        const { context, tasks, microtasks, macrotasks, outputs } = createSafeExecutionContext();

        // 重置状态
        setTaskQueue([]);
        setMicroTaskQueue([]);
        setMacroTaskQueue([]);
        setConsoleOutput([]);
        setIsRunning(true); // 设置运行状态为 true

        try {
            // 使用 Function 构造函数动态执行代码，并传入 mock 后的 console, Promise, setTimeout
            const executeFunction = new Function(
                'console', 'Promise', 'setTimeout',
                code // 用户输入的代码
            );

            executeFunction( // 执行代码
                context.console, // 传入 mock 的 console
                context.Promise, // 传入 mock 的 Promise
                context.setTimeout // 传入 mock 的 setTimeout
            );


            // 延迟一段时间后更新状态，模拟异步执行完成
            setTimeout(() => {
                setIsRunning(false); // 设置运行状态为 false
                setTaskQueue(tasks); // 更新同步任务队列
                setMicroTaskQueue(microtasks); // 更新微任务队列
                setMacroTaskQueue(macrotasks); // 更新宏任务队列
                setConsoleOutput(outputs); // 更新控制台输出
            }, 100); // 延迟 100ms

        } catch (error) { // 捕获代码执行错误
            setIsRunning(false); // 设置运行状态为 false
            setConsoleOutput([{ // 设置错误信息到控制台输出
                type: 'error',
                content: error.toString(), // 错误信息转换为字符串
                timestamp: Date.now() // 记录时间戳
            }]);
        }
    };

    // 处理 "运行" 按钮点击事件
    const handleRun = () => {
        setIsRunning(true); // 设置运行状态为 true
        executeCode(); // 执行代码
    };

    // 处理 "重置" 按钮点击事件
    const handleReset = () => {
        setIsRunning(false); // 设置运行状态为 false
        setTaskQueue([]); // 重置同步任务队列
        setMicroTaskQueue([]); // 重置微任务队列
        setMacroTaskQueue([]); // 重置宏任务队列
        setConsoleOutput([]); // 重置控制台输出
    };
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6 border-blue-400">
                <MonacoEditor
                    height="64vh" // Adjust height as needed
                    defaultLanguage="javascript"
                    value={code}
                    onChange={handleEditorChange}
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorDidMount}
                    theme="myTheme" // Make sure theme name matches
                    options={{ // Editor options for customization
                        selectOnLineNumbers: true,
                        automaticLayout: true, // Ensure editor resizes correctly
                        minimap: {
                            enabled: false // Disable minimap if you don't want it
                        },
                        wordWrap: 'wordWrapColumn', // or 'on', 'off' for word wrapping
                        wordWrapColumn: 80,
                        wrappingIndent: 'indent',
                        lineNumbers: 'on', // Show line numbers - 'on' or 'off' or 'relative' or 'interval'
                        fontSize: 14, // Adjust font size
                        fontFamily: 'monospace', // Choose a font
                        scrollBeyondLastLine: false, // Prevent scrolling past the last line
                        glyphMargin: false, // Disable glyph margin
                        lineDecorationsWidth: 20,
                        folding: true, // Enable code folding
                        showFoldingControls: 'mouseover', // Show folding controls on hover
                        renderLineHighlight: 'line', // Highlight the current line
                        cursorBlinking: 'blink', // Cursor animation style
                        cursorSmoothCaretAnimation: true,
                        cursorStyle: 'line', // Cursor style ('line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin')
                        roundedSelection: true,
                        suggestOnTriggerCharacter: true, // Trigger suggestions on trigger characters like '.'
                        tabSize: 4, // Tab size
                        insertSpaces: true, // Insert spaces when pressing Tab
                        detectIndentation: true, // Automatically detect indentation
                        quickSuggestions: true, // Enable quick suggestions
                        snippetSuggestions: 'top', // Place snippet suggestions at the top
                        showUnused: true, // Show unused variables
                        parameterHints: true, // Enable parameter hints
                        codeLens: false, // Disable CodeLens
                        formatOnType: false, // Disable format on type
                        formatOnPaste: false, // Disable format on paste
                    }}
                />
            </div>

            <div className="flex justify-center space-x-4 mb-8">
                <button
                    onClick={handleRun}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={isRunning}
                >
                    <PlayCircle className="mr-2" size={20} />
                    执行代码
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    <RotateCcw className="mr-2" size={20} />
                    重置
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">同步任务 (执行栈)</h3>
                    <div className="border-2 border-blue-500 p-4 min-h-48 rounded-lg">
                        {taskQueue.map((task, index) => (
                            <div key={index} className="bg-blue-200 p-2 rounded mb-2">
                                {task.content}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">微任务队列 (Microtask Queue)</h3>
                    <div className="border-2 border-green-500 p-4 min-h-48 rounded-lg">
                        {microTaskQueue.map((task, index) => (
                            <div key={index} className="bg-green-200 p-2 rounded mb-2">
                                {task.content}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg border-red-400 font-semibold">宏任务队列 (Macrotask Queue)</h3>
                    <div className="border-2 border-red-500 p-4 min-h-48 rounded-lg">
                        {macroTaskQueue.map((task, index) => (
                            <div key={index} className="bg-red-100 p-2 rounded mb-2">
                                {task.content}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">控制台输出</h3>
                <div className="bg-gray-900 text-white p-4 rounded-lg min-h-48">
                    {consoleOutput.map((output, index) => (
                        <div
                            key={index}
                            className={`font-mono ${output.type === 'error' ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {`> ${output.content}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventLoopVisualizer;