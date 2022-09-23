const CREATE_LOOP = (func, min) => {
    func()
    setTimeout(() => {
        CREATE_LOOP(func, min)
    }, 1000 * 60 * min)
};

module.exports = { CREATE_LOOP };