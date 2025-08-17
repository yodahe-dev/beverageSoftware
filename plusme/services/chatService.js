function getConversationId(userA, userB) {
    const sorted = [userA, userB].sort();
    return `${sorted[0]}-${sorted[1]}`;
}

module.exports = { getConversationId };
