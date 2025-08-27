export function generateTransactionId(prefix = "TXN") {
    const timestamp = Date.now().toString(36); // base36 makes it shorter
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${randomStr}`;
}
