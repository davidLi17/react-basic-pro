import { useEffect, useState, useRef } from 'react'
import './App.scss'
import avatar from './images/bozai.png'
import _ from 'lodash'
import classNames from 'classnames'
import { Heart } from 'lucide-react'
import MyComponent from './components/InputDom'
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
/**
 * 评论列表的渲染和操作
 *
 * 1. 根据状态渲染评论列表
 * 2. 删除评论
 */

// 评论列表数据
const defaultList = [
  {
    // 评论id
    rpid: 3,
    // 用户信息
    user: {
      uid: '13258165',
      avatar: '',
      uname: '周杰伦',
    },
    // 评论内容
    content: '哎哟，不错哦',
    // 评论时间
    ctime: '10-18 08:15',
    like: 128,
  },
  {
    rpid: 2,
    user: {
      uid: '36080105',
      avatar: '',
      uname: '许嵩',
    },
    content: '我寻你千百度 日出到迟暮',
    ctime: '11-13 11:29',
    like: 88,
  },
  {
    rpid: 1,
    user: {
      uid: '30009257',
      avatar,
      uname: '李昊戈',
    },
    content: '我知道你急',
    ctime: '10-19 09:00',
    like: 66,
  },
]
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
  const [commentList, setCommentList] = useState(_.orderBy(defaultList, 'like', 'desc'));
  const [activeTab, setActiveTab] = useState('hot');
  const [uploadFiles, setUploadFiles] = useState([]);
  const textareaRef = useRef(null);

  const handLeDel = (rpid) => {
    console.log("删除评论", rpid);

    setCommentList(commentList.filter(item => item.rpid !== rpid))
  }
  const handleClickFormTab = (type) => {
    setActiveTab(type);
    setCommentList(prevList => {
      // 使用lodash的clone创建新数组
      const newCommentList = _.clone(prevList);
      // 使用lodash的orderBy进行排序
      return type === 'hot'
        ? _.orderBy(newCommentList, ['like'], ['desc'])
        : _.orderBy(newCommentList, [(item) => new Date(item.ctime).getTime()], ['desc']);
    });
  }
  const handleLike = (rPid) => {
    setCommentList(prev => prev.map(item => {
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

    setCommentList(prevList => {
      const newList = [...prevList, newComment];
      return newList;
    });

    setComment('');
    setUploadFiles([]);
    textareaRef.current.focus();
  };
  useEffect(() => {
    console.log('Updated commentList:', commentList);
  }, [commentList]);
  useEffect(() => {
    return () => {
      uploadFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [uploadFiles]);

  return (
    <div className="app">
      {/* 导航 Tab */}
      <div className="reply-navigation">
        <ul className="nav-bar">
          <li className="nav-title">
            <span className="nav-title-text">评论</span>
            {/* 评论数量 */}
            <span className="total-reply">{10}</span>
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
          {commentList.map((item) => {
            return (
              <div key={item.rpid} className="reply-item">
                {/* 头像 */}
                <div className="root-reply-avatar">
                  <div className="bili-avatar">
                    <img
                      className="bili-avatar-img"
                      alt=""
                      src={item.user.avatar}
                    />
                  </div>
                </div>

                <div className="content-wrap">
                  {/* 用户名 */}
                  <div className="user-info">
                    <div className="user-name">{item.user.uname}</div>
                  </div>

                  {/* 评论内容 */}
                  <div className="root-reply">
                    <span className="reply-content">{item.content}</span>
                    {item.images && item.images.length > 0 && (
                      <div className="reply-images">
                        {item.images.map((image, index) => (
                          <div key={index} className="image-item">
                            <img src={image} alt={`评论图片 ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="reply-info">
                      {/* 评论时间 */}
                      <span className="reply-time">{item.ctime}</span>
                      {/* 评论数量 */}
                      <span className="reply-time">点赞数:{item.like}</span>
                      <div
                        className={classNames('reply-like', { active: item.isLiked })}
                        onClick={() => handleLike(item.rpid)}
                      >
                        <Heart
                          className='like-icon'
                          fill={item.isLiked ? '#ff6b6b' : 'none'} />
                      </div>
                      {item.user.uid === user.uid && <span onClick={() => handLeDel(item.rpid)} className="delete-btn">
                        删除
                      </span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          )}
        </div>
      </div>
    </div>
  )
}

export default App;