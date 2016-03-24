# Credits: https://github.com/benmanbs/javascript-skeleton/
require 'json'

# Get the current version number from the json file
def get_version
  file = File.read('./package.json')
  data_hash = JSON.parse(file)
  data_hash['version']
end

# Increment the given version number
def increment_version (version, increment)
  types = {"major" => 0, "minor" => 1, "patch" => 2}
  arr = version.split(".")
  arr[types[increment]] = arr[types[increment]].to_i() +1
  (types[increment]+1...arr.size).each{|i| arr[i] = 0}
  arr.join(".")
end

# Write the new version number to the json file
def write_version (version)
  file = File.read('./package.json')
  data_hash = JSON.parse(file)
  data_hash['version'] = version

  File.open("./package.json","w") { |f|
    f.write(JSON.pretty_generate(data_hash))
  }
end

increment = ARGV[0]
version = get_version
new_version = increment_version(version, increment)
write_version(new_version)
puts new_version
