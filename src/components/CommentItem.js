import React from 'react';
import classNames from 'classnames';
import { Heart } from 'lucide-react';
import '../App.scss'


const CommentItem = ({ item, handLeDel, handleLike, currentUserUid }) => {
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
                        {item.user.uid === currentUserUid && <span onClick={() => handLeDel(item.rpid)} className="delete-btn">
                            删除
                        </span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;