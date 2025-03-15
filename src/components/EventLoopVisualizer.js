import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';
import CodeEditor from './CodeEditor';
import VisualizerDisplay from './VisualizerDisplay';
import { Button, message } from 'antd';
const EventLoopVisualizer = () => {
    const editorRef = useRef(null);
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
    const [taskQueue, setTaskQueue] = useState([]);
    const [microTaskQueue, setMicroTaskQueue] = useState([]);
    const [macroTaskQueue, setMacroTaskQueue] = useState([]);
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const messageList = {
        saveCode: () => {
            messageApi.success('代码已格式化并保存', 1);
        },
        execCode: () => {
            messageApi.success('代码已执行', 1);
        }
    }

    const createSafeExecutionContext = useCallback(() => {
        const tasks = [];
        const microtasks = [];
        const macrotasks = [];
        const outputs = [];

        const mockConsole = {
            log: (...args) => {
                outputs.push({
                    type: 'log',
                    content: args.join(' '),
                    timestamp: Date.now()
                });
                tasks.push({
                    type: 'sync',
                    content: `console.log(${args.join(', ')})`,
                    output: args.join(' ')
                });
            }
        };

        const MockPromise = function (executor) {
            const realPromise = new Promise(executor);

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

        MockPromise.resolve = Promise.resolve;
        MockPromise.reject = Promise.reject;
        MockPromise.all = Promise.all;
        MockPromise.race = Promise.race;


        const mockSetTimeout = (callback, delay) => {
            macrotasks.push({
                type: 'macro',
                content: `setTimeout(..., ${delay}) - callback enqueued`,
                output: undefined
            });
            return setTimeout(callback, delay);
        };

        return {
            context: {
                console: mockConsole,
                Promise: MockPromise,
                setTimeout: mockSetTimeout
            },
            tasks,
            microtasks,
            macrotasks,
            outputs
        };
    }, []);

    const executeCode = useCallback(() => {
        const { context, tasks, microtasks, macrotasks, outputs } = createSafeExecutionContext();

        setTaskQueue([]);
        setMicroTaskQueue([]);
        setMacroTaskQueue([]);
        setConsoleOutput([]);
        setIsRunning(true);

        try {
            const executeFunction = new Function(
                'console', 'Promise', 'setTimeout',
                code
            );

            executeFunction(
                context.console,
                context.Promise,
                context.setTimeout
            );


            setTimeout(() => {
                setIsRunning(false);
                setTaskQueue(tasks);
                setMicroTaskQueue(microtasks);
                setMacroTaskQueue(macrotasks);
                setConsoleOutput(outputs);
            }, 100);

        } catch (error) {
            setIsRunning(false);
            setConsoleOutput([{
                type: 'error',
                content: error.toString(),
                timestamp: Date.now()
            }]);
        }
    }, [code, createSafeExecutionContext]);

    const handleRun = useCallback(() => {
        setIsRunning(true);
        executeCode();
    }, [executeCode]);

    // Move handleEditorWillMount before handleEditorDidMount
    const handleEditorWillMount = useCallback((monaco) => {
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    }, []);
    useEffect(() => {
        const code = localStorage.getItem("CodeEditor");
        if (code) {
            setCode(code);
        }
    }, []);
    const handleEditorDidMount = useCallback((editor, monaco) => {
        editorRef.current = editor;

        monaco.editor.defineTheme('myTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'regexp', foreground: 'D16969' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'function', foreground: 'DCDCAA' },
                { token: 'variable', foreground: '9CDCFE' },
                { token: 'operator', foreground: 'D4D4D4' }
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#2F3337',
                'editor.selectionBackground': '#264F78',
                'editor.inactiveSelectionBackground': '#3A3D41',
                'editorCursor.foreground': '#AEAFAD',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#C6C6C6',
                'editor.findMatchBackground': '#515C6A',
                'editor.findMatchHighlightBackground': '#3A3D41',
                'editorBracketMatch.background': '#0D3A58',
                'editorBracketMatch.border': '#216F9C',
                'editorGutter.background': '#1E1E1E',
                'editorWidget.background': '#252526',
                'editorSuggestWidget.background': '#252526',
                'editorSuggestWidget.border': '#454545',
                'editorSuggestWidget.foreground': '#D4D4D4',
                'editorSuggestWidget.selectedBackground': '#094771'
            }
        });
        monaco.editor.setTheme('myTheme');

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
                const formatAction = editor.getAction('editor.action.formatDocument');
                if (formatAction) {
                    formatAction.run()
                        .then(() => {
                            messageList.saveCode();
                            localStorage.setItem("CodeEditor", code);
                        })
                        .catch(error => {
                            console.error('格式化代码失败:', error);
                        });
                } else {
                    console.log('格式化 Action 未找到，仅保存代码:');
                }
            }
        );
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            handleRun();
            messageList.execCode();
        });
    }, [handleRun]); // handleRun 依赖需要加入


    const handleEditorChange = useCallback((value, event) => {
        setCode(value);
    }, []);

    const handleReset = () => {
        setIsRunning(false);
        setTaskQueue([]);
        setMicroTaskQueue([]);
        setMacroTaskQueue([]);
        setConsoleOutput([]);
    };

    return (

        <div className="p-6 max-w-6xl mx-auto">
            <>
                {contextHolder}
            </>
            <CodeEditor
                code={code}
                setCode={setCode}
                handleEditorWillMount={handleEditorWillMount}
                handleEditorDidMount={handleEditorDidMount}
                handleEditorChange={handleEditorChange}
            />

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

            <VisualizerDisplay
                taskQueue={taskQueue}
                microTaskQueue={microTaskQueue}
                macroTaskQueue={macroTaskQueue}
                consoleOutput={consoleOutput}
            />
        </div>
    );
};

export default EventLoopVisualizer;