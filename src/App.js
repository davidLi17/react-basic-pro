import { useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import useFetchDataWithRetryAxios from './utils/useFetchDataWithRetryAxios';
import './App.scss';
import avatar from './images/bozai.png';
import CommentItem from './components/CommentItem';
import MyComponent from './components/InputDom';
/**
 * 评论列表的渲染和操作
 *
 * 1. 根据状态渲染评论列表
 * 2. 删除评论
 */

// 评论列表数据 (现在从hook获取，这里不再需要默认数据)
// const defaultList = [...]

// 当前登录用户信息
const user = {
  // 用户id
  uid: '30009257',
  // 用户头像
  avatar,
  // 用户昵称
  uname: '李昊戈',
}

/**
 * 导航 Tab 的渲染和操作
 *
 * 1. 渲染导航 Tab 和高亮
 * 2. 评论列表排序
 *  最热 => 喜欢数量降序
 *  最新 => 创建时间降序
 */

// 导航 Tab 数组
const tabs = [
  { type: 'hot', text: '最热' },
  { type: 'time', text: '最新' },
]

const App = () => {
  const [comment, setComment] = useState('');
  // const [commentList, setCommentList] = useState([]); // 从 hook 中获取数据
  const [activeTab, setActiveTab] = useState('hot');
  const [uploadFiles, setUploadFiles] = useState([]);
  const textareaRef = useRef(null);

  // 使用自定义 Hook 获取评论列表数据
  const { data: commentList, loading, error } = useFetchDataWithRetryAxios("http://localhost:3004/list");
  const [localCommentList, setLocalCommentList] = useState(commentList); // 本地状态用于排序和修改，避免直接修改 hook 返回的 data

  useEffect(() => {
    setLocalCommentList(commentList); // 当 commentList 从 hook 更新时，同步到本地状态
  }, [commentList]);


  const handLeDel = (rpid) => {
    console.log("删除评论", rpid);
    setLocalCommentList(localCommentList.filter(item => item.rpid !== rpid))
  }
  const handleClickFormTab = (type) => {
    setActiveTab(type);
    setLocalCommentList(prevList => {
      // 使用lodash的clone创建新数组
      const newCommentList = _.clone(prevList);
      // 使用lodash的orderBy进行排序
      return type === 'hot'
        ? _.orderBy(newCommentList, ['like'], ['desc'])
        : _.orderBy(newCommentList, [(item) => new Date(item.ctime).getTime()], ['desc']);
    });
  }
  const handleLike = (rPid) => {
    setLocalCommentList(prev => prev.map(item => {
      if (item.rpid === rPid) {
        return {
          ...item,
          like: item.isLiked ? item.like - 1 : item.like + 1,
          isLiked: !item.isLiked
        }
      }
      return item;
    }))
  }
  // 处理拖拽文件
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    console.log('In App.js Drop files::: ', files);
    handleFiles(files);
  };

  // 处理粘贴文件
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    console.log('In App.js paste items::: ', items);
    const files = [];

    if (items) {
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          files.push(file);
        }
      }
      if (files.length > 0) {
        handleFiles(files);
      }
    }
  };

  // 统一处理文件
  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newFiles = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  // 删除上传的文件
  const handleRemoveFile = (index) => {
    setUploadFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // 修改发送评论的函数
  const handleSendComment = () => {
    if (!comment && uploadFiles.length === 0) {
      return;
    }

    const newComment = {
      rpid: uuidv4(),
      user,
      content: comment,
      ctime: dayjs(new Date()).format('MM-DD HH:mm'),//月-日 时:分
      like: 0,
      images: uploadFiles.map(f => f.preview)
    };

    setLocalCommentList(prevList => {
      const newList = [...prevList, newComment];
      return newList;
    });

    setComment('');
    setUploadFiles([]);
    textareaRef.current.focus();
  };

  useEffect(() => {
    return () => {
      uploadFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadFiles]);

  if (loading) {
    return <div>Loading comments...</div>; // 或者更好的加载指示
  }

  if (error) {
    return <div>Error: {error.message}</div>; // 或者更好的错误处理
  }

  return (
    <div className="app">
      {/* 导航 Tab */}
      <div className="reply-navigation">
        <ul className="nav-bar">
          <li className="nav-title">
            <span className="nav-title-text">评论</span>
            {/* 评论数量 */}
            {localCommentList && localCommentList.length > 0 && (<span className="nav-title-count">{localCommentList.length}</span>)}
          </li>
          <li className="nav-sort">
            {/* 高亮类名： active */}
            {tabs.map((item) => (
              <span
                key={item.type}
                onClick={() => handleClickFormTab(item.type)}
                className={classNames('nav-item', { active: activeTab === item.type })}>
                {item.text}
              </span>
            ))}
          </li>
        </ul>
      </div>

      <div className="reply-wrap">
        {/* 发表评论 */}
        <div className="box-normal">
          {/* 当前用户头像 */}
          <div className="reply-box-avatar">
            <div className="bili-avatar">
              <img className="bili-avatar-img" src={avatar} alt="用户头像" />
            </div>
          </div>
          <div className="reply-box-wrap">
            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              maxLength={1000}
              onKeyDown={e => {
                if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && e.metaKey)) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
              className="reply-box-textarea"
              placeholder="发一条友善的评论(最多1000字)，支持拖拽和粘贴上传图片"
            />
            {uploadFiles.length > 0 && (
              <div className="upload-preview">
                {uploadFiles.map((file, index) => {
                  const isLargeFile = file.file.size > 5 * 1024 * 1024; // 5MB limit
                  if (isLargeFile) {
                    return (
                      <div key={index} className="preview-item error">
                        <span className="error-message">文件过大，请上传5MB以下的图片</span>
                        <span onClick={() => handleRemoveFile(index)} className="preview-close">
                          删除
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="preview-item">
                      <img className='preview-img' src={file.preview} alt="预览图" />
                      <span onClick={() => handleRemoveFile(index)}
                        className="preview-close">删除图片</span>
                    </div>
                  )
                })}
              </div>
            )}
            <MyComponent />
            {/* 发布按钮 */}
            <div className="reply-box-send">
              <div
                className="send-text"
                onClick={handleSendComment}
              >
                发布
              </div>
            </div>
          </div>
        </div>
        {/* 评论列表 */}
        <div className="reply-list">
          {/* 此处必须使用条件渲染 */}
          {localCommentList && localCommentList.map((item) => {
            // 使用 CommentItem 组件，传递 props
            return (
              <CommentItem
                key={item.rpid}
                item={item}
                handLeDel={handLeDel}
                handleLike={handleLike}
                currentUserUid={user.uid} // 传递当前用户uid
              />
            )
          }
          )}
        </div>
      </div>
    </div>
  )
}

export default App;