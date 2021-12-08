// the initial port for each "stack" of servers and path letter used to call servers in that stack
// to add an option - add a key;value pair
const ports = {
  A: 3000,
  O: 3100,
  L: 3200,
  S: 3300
}

// how many servers we need
const count = 20

module.exports = {
  ports,
  count
}
