                      <div key={letter} className="contact-section">
                        <div className="section-header">{letter}</div>
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
                      </div>