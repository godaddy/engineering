---
layout: post
title: Building a Fluent-Bit Plugin in Go
date: 2022-03-22 00:00:00 -0700
cover: /assets/images/fluent-bit-plugin-go/cover.svg
options:
  - full-bleed-cover
excerpt: Fluent Bit is a powerful tool for log management, filtering and exporting. Learn how you can extend its functionality even further using Go to build output plugins
keywords: fluent-bit, logging, go, plugins
authors:
  - name: Todd Kennedy
    title: Principal Software Developer
    url: https://github.com/toddself
    photo: /assets/images/tkennedy.png
---

Here at GoDaddy, some of our services use [Fluent Bit](https://docs.fluentbit.io/manual) for log exporting, filtering,
and management.  The ability to define inline filters using [Lua](https://www.lua.org/about.html), plus the wide
ecosystem support for both input and output plugins, makes this project a powerful
choice for managing your logging pipeline.

Fluent Bit supports writing a wide variety of input and output plugins in C (using
their C Library API), but with version 1.4 it also supports writing output
plugins in Go thanks to Go's easy ability to generate C-style shared libraries.

## Prerequisites

You'll need the following versions of Go and Fluent Bit:

* Go 1.14 or higher
* Fluent Bit 1.4 or higher

## Getting Started

The first thing we need to do is set up the basic structure of a Fluent Bit plugin by creating the
expected methods and explaining to the Go compiler how it should handle naming
the exported symbols when it compiles the code.

There are four methods that we need to provide to make a valid plugin:

* `FLBPluginRegister(ctx unsafe.Pointer) int`
* `FLBPluginInit(ctx unsafe.Pointer) int`
* `FLBPluginFlush(data unsafe.Pointer, length C.int, tag *C.char) int`
* `FLBPluginExit() int`

(There is also an `FLBPluginFlushCtx` used for when you need to create multiple
contexts for your plugin; we aren't covering this use-case here.)

As with many C-style libraries, these are all expected to return an integer
representing their status. Each of these functions needs to be exposed and useable from C, so we'll need to
add a compiler comment right before each declaration:

```go
//export FLBPluginRegister
func FLBPluginRegister(ctx unsafe.Pointer) int {}

//export FLBPluginInit
func FLBPluginInit(ctx unsafe.Pointer) int {}

//export FLBPluginFlush
func FLBPluginFlush(data unsafe.Pointer, length C.int, tag *C.char) int {}

//export FLBPluginExit
func FLBPluginExit() int {}
```

Don't let that little `unsafe` thing worry you -- we're not doing anything directly
with the pointer, but rather passing it back into the functions so the host can
read the proper information about this current plugin.

Now when we compile this into a shared-lib, the Fluent Bit host will be able to
call these methods! However, this bare-bones implementation is not going to
do anything, so it might be helpful to think about the life cycle of the
plugin so we know where to put our code.

## The Plugin Life Cycle

When we tell Fluent Bit about our plugin it'll load the library and attempt to
invoke the `FLBPluginRegister` function, which will set any necessary context as
well as add the plugin to the internal registry, setting its name (along with
a description), so that we can reference this in our `[OUTPUT]` section.

Fluent Bit will then parse the configuration and if we've referenced our plugin
in an `[OUTPUT]` stanza, it will invoke the `FLBPluginInit` function.  This is
where we should do our configuration and prepare ourselves for receiving data,
which will be sent on the standard `Flush` interval by calling `FLBPluginFlush`.

Finally, when Fluent Bit exits, it will call `FLBPluginExit` where we can perform
any clean-up necessary.

## A Bare-Bones Example

With all this knowledge in mind, let's go and build a valid plugin that does nothing!

We'll start by creating a new Go module with `go mod init [path to package]` and
getting the plugin harness with `go get github.com/fluent/fluent-bit-go`. We'll
also need to import the `output` package from that library which provides us
with the necessary methods to manipulate the underlying c `struct`s that will
explain to Fluent Bit how to use our plugin, as well as decode the data provided by
Fluent Bit into data Go can understand.

The exported interface for the `output` library is blissfully small, and with it, we can:

* Initialize the plugin with `output.FLBPluginRegister`
* Read in data from the config for the plugin using `output.FLBPluginConfigKey`
* Set data about the current plugin's context using `output.FLBPluginSetContext`
* Read the context data with `output.FLBPluginGetContext`
* Read log data with `output.NewDecoder` and `output.GetRecord`

As the first step in the life cycle is to register the plugin, we should call
the `output.FLBPluginRegister` function from inside of our `FLBPluginRegister`
function. It takes three arguments: a C pointer and two strings:

```go
package output

func FLBPluginRegister(def unsafe.Pointer, name, desc string) int {}
```

The pointer is passed in by Fluent Bit to our function, and then the two strings
are the name of the plugin (this is what you'll use in the `[OUTPUT]` stanza
in the configuration) and a description for the plugin. Since we have to return
the status of our plugin. Since we've done very little here we return `output.FLB_OK`
which tells Fluent Bit it can continue initialization.

```go
//export FLBPluginRegister
func FLBPluginRegister(ctx unsafe.Pointer) int {
  output.FLBPluginRegister(ctx, "noopplugin", "this plugin does nothing")
  return output.FLB_OK
}
```

After that, there's not much else to do to create a minimal do-nothing plugin,
just implementing the rest of the required functions and returning the same
`output.FLB_OK`:

```go
package noopplugin

import (
  "C"
  "unsafe"

  "github.com/fluent/fluent-bit-go/output"
)

//export FLBPluginRegister
func FLBPluginRegister(ctx unsafe.Pointer) int {
  output.FLBPluginRegister(ctx, "noopplugin", "this plugin does nothing")
  return output.FLB_OK
}

//export FLBPluginInit
func FLBPluginInit(ctx unsafe.Pointer) int {
  return output.FLB_OK
}

//export FLBPluginFlush
func FLBPluginFlush(data unsafe.Pointer, length C.int, tag *C.char) int {
  return output.FLB_OK
}

//export FLBPluginExit
func FLBPluginExit() int {
  return output.FLB_OK
}
```

However, we probably want this plugin to _do_ something for us, so let's start
by figuring out how to decode the data we get when Fluent Bit flushes its messages
to us.

The `output` package provides a `Decoder` struct which we can use to pass in the
pointer to our set of data and get back a `map[interface{}]interface{}`.

The first thing we need to do is create a new `Decoder`, giving it the pointer
to the data `struct` and the length of the data object, both of which are provided
to us in the function signature:

```go
//export FLBPLuginFlush
fuinc FLBPluginFlush(data unsafe.Pointer, length C.int, tag *C.char) int {
  decoder := output.NewDecoder(data, int(length))
  return output.FLB_OK
}
```

Once we have a decoder we can call `output.GetRecord` in a loop to retrieve
the individual records from Fluent Bit.  The signature of this function is a little
strange for Go as it returns three things: The status (as an integer), the
timestamp for the record, and the data itself (as a `map[interface{}]interface{}`). This
means when we loop over it, we loop until the first value returns non-zero. This
isn't an error -- it just means we have no data left to read!

```go
//export FLBPLuginFlush
func FLBPluginFlush(data unsafe.Pointer, length C.int, tag *C.char) int {
  decoder := output.NewDecoder(data, int(length))
  for {
    ret, ts, record := output.GetRecord(dec)
    if ret != 0 {
      break
    }
  }
  return output.FLB_OK
}
```

The second bit of data, the timestamp, is a little strange since it can
either be a 64-bit integer representing the Unix epoch, or the `output.FLBTime`
object from which a Go `time.Time` object can be obtained. Because of this, we'll
use a type switch statement to determine what we have:

```go
var t time.Time
switch t := ts.(type) {
case output.FLBTime:
  t = ts.(output.FLBTime).Time
case uint64:
  t = time.Unix(int64(t), 0)
default:
  t = time.Now()
}
```

Since this is the timestamp of when Fluent Bit processed this record, your data
might have a more applicable timestamp in it, so we can always just ignore this
field with a `_` assignment in the call to `output.GetRecord(dec)`.

Decoding the actual log data is similar here, we know that the key in the map will
always be a string, so we can just cast that to a string, but the `interface{}` value
of each record could represent whatever your data is, including a slice of uint8
values (which can be converted into a string) or `nil` itself for missing values.

We can decode this with another type switch as well (and punt on non-string, non-nil values)

```go
for k, v := range record {
  key := k.(string)

  var val string
  switch v.(type) {
  case []uint8:
    val = string(v.([]uint8))
  case nil:
    val = ""
  default:
    val = fmt.Sprintf("%v", v)
  }
}
```

As for the last argument to the function, `tag *C.char`, we can access this data
by passing it into `C.GoString()` and get access to the Fluent Bit tag that this
data was given.

Putting this all together we now have:

```go
//export FLBPluginFlush
func FLBPluginFlush(data unsafe.Pointer, length C.int, tag *C.char) int {
  decoder := output.NewDecoder(data, int(length))
  var records []map[string]string
  for {
    ret, ts, record := output.GetRecord(dec)
    if ret != 0 {
      break
    }

    var t time.Time
    switch t := ts.(type) {
    case output.FLBTime:
      t = ts.(output.FLBTime).Time
    case uint64:
      t = time.Unix(int64(t), 0)
    default:
      t = time.Now()
    }

    r := make(map[string]string)
    for k, v := range record {
      key := k.(string)

      var val string
      switch v.(type) {
      case []uint8:
        val = string(v.([]uint8))
      case string:
        val = v
      case nil:
        val = ""
      default:
        val = fmt.Sprintf("%v", v)
      }
      r[key] = val
    }
    r["tag"] = C.GoString(tag)
    records = append(records, r)
  }

  return output.FLB_OK
}
```

If we ran into an error decoding this we can return an `output.FLB_ERROR` instead,
or if the issue is possibly transient and we don't want to have Fluent Bit
hanging out, we can return `output.FLB_RETRY` which will cause Fluent Bit to
call the flush function again on its next pass with the same data.

## Building the Plugin

In order to build the plugin, we need to pass a flag to the Go compiler to tell
it how to build the shared library format: `-buildmode c-shared`. We also _must_
name the plugin starting with `out_` and ending with `.so` or Fluent Bit will
not load it.

```
go build -buildmode=c-shared -o out_noop_plugin.so`
```

We can load this into Fluent Bit by passing the `-e` flag to the CLI, or
configuring the `[PLUGINS]` section in the configuration file.

```
fluent-bit -e out_noop_plugin.so -c fluent-bit.conf
```

Don't forget to add the plugin to Fluent Bit in the configuration file:

```ini
[OUTPUT]
Name noopplugin
Match *
Id noopplugin
```

Any additional key/value fields in the configuration file can be accessed with the
`output.FLBPluginConfigKey` function. Also note that the `Name` field in the configuration
must match the name passed into `output.FLBPluginRegister`.

## Conclusion

Fluent Bit's flexibility in interacting with your log pipeline was already extremely
versatile, and with the ability to write plugins in a memory managed runtime makes it
even more so.

For more examples, please check out [Fluent-bit-go](https://github.com/fluent/fluent-bit-go/) on GitHub!

If this is the type of work that interests you, the Edge Front-Door team is
hiring! [Click here to apply](https://careers.godaddy.com/job/new-york/principal-software-engineer-edge-services/7795/16354391168).
