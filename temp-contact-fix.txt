                        {friendsList.map(friend => (
                          <div 
                            key={friend.username} 
                            className="contact-item"
                            onClick={() => {
                              setSelectedFriend(friend);
                              setShowFriendProfile(true);
                            }}
                          >
                            <div className="contact-avatar">
                              {getInitial(friend.username)}
                            </div>
                            <div className="contact-info">
                              <div className="contact-name">{friend.username}</div>
                            </div>
                          </div>
                        ))}