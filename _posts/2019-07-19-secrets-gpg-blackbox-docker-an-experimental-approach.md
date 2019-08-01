---
layout: post
title: "Secrets, GPG, BlackBox, and Docker - an Experimental Approach"
date: 2019-07-19 09:00:00 -0700
cover: /assets/images/secrets-gpg-blackbox-docker-an-experimental-approach/cover.png
excerpt: This article describes an experimental approach on how Blackbox and Docker can be used in combination to manage secrets.
authors:
  - name: Mayank Jethva
    title: Software Engineer
    url: https://github.com/mayank23
    photo: https://avatars.githubusercontent.com/mayank23
---

This post describes an experimental containerized approach for using Blackbox, created by StackOverflow, to secure secrets. We'll have a detailed walkthrough about compiling our own version of GPG and Blackbox and running them on a container.

> **Secrets:** protected data such as passwords, ssl certificates, or any other data needing protection.

## A frame of reference

> **This tutorial is primarily for learning purposes only.**

Before we begin, let's discuss some cautionary information.

First, securing secrets takes both engineering effort and developing safe and reliable processes around their upkeep. Generally, storing secrets in source control is an anti-pattern without proper security measures in place. If you have a managed secrets solution already available then you should stick with that. For example, if you are on AWS or some platform which provides secrets management you should not roll your own secrets management solution, thus preventing the rise of possible security holes in your secrets management process.

On the other hand, if you do not have a secrets management solution available, then leveraging a solution like Blackbox to encrypt your secrets is a potential option. As should be done when approaching any problem, evaluate the constraints of your problem and take an in depth look at possible solutions already availble and how they can best fit your needs.

> Remember, in terms of security, there must be both secure software and robust policies and workflows around managing the items you need to secure. This blogpost provides a look at the "software" portion. However, you must ensure you have policies, for example, on:

    - key rotation
    - memory protection
    - secure remote access methods - e.g) https, restricted networks
    - secure backups
    - follow the principle of least priviledge
    - monitoring regarding access or use
    - sufficient employee awareness of these practices and more.
    - leveraging crpypto software and algorithms which are thoroughly tested, maintained, and have a broad community of users. Don't use one-off solutions for your cryptography needs.
    - and more.

As for my team, we did not have an approved secrets manager available at the time, so we evaluated Blackbox as being the best stop-gap measure until an approved secrets manager was designed and deployed. In the process of setting up Blackbox on each developer's machine, we found that leveraging Docker made the process much more accessible and robust.

**Now, let's dive in!**

## A quick introduction to Asymmetric Cryptography and using Blackbox to secure secrets

A prominent solution created by StackExchange to manage secrets within a version control system (VCS) is [Blackbox](https://github.com/StackExchange/blackbox). Here's the brief project description from its README:

> Safely store secrets in a VCS repo (i.e. Git, Mercurial, Subversion or Perforce). These commands make it easy for you to Gnu Privacy Guard (GPG) encrypt specific files in a repo so they are "encrypted at rest" in your repository. However, the scripts make it easy to decrypt them when you need to view or edit them, and decrypt them for use in production.

At its core, it relies on Gnu Privacy Guard (GPG) to encrypt/decrypt files using asymmetric cryptography. The following is a brief summary of asymmetric cryptography:

- A private key kept for yourself,
- A public key which you give to the....public. (i.e, other entities which you want to communicate with).
- Assume Alice has generated a GPG public/private keypair, (often just denoted as a GPG keypair).
- Alice can send a message to Bob by encrypting a message (i.e, plaintext) with Bob's public key. Only Bob can decrypt this message since he has the corresponding private key.
- Bob can send a message to Alice by encrypting a message using Alice's public key. Only Alice can decrypt this message because she has the corresponding private key. 
- But the question remains about how Alice and Bob can verify the authenticity and integrity of the message. 
- Alice can first construct the following: 
  1. plain original message (i.e, "Hey, what's up?")
  2. A signed secure hash of the original message using her private key
  3. hashing algortihm details (i.e, SHA256)
- Alice can combine all of these individual pieces and encrypt it with Bob's public key, then send the result to Bob.
- Once Bob decrypts the received message he can has three pieces. 
- Bob can verify the authenticity and integrity by first computing a secure hash based off the algorithm details sent by Alice of the plain original message, followed by using Alice's public key to verify the signed hash which was received. If the received signed hash and the computed hash match, the message was not tampered with. Also, since only Alice's private key could be used generate the received signed hash, Bob knows this message is actually from Alice.

There are a few algorithms which support asymmetric encryption/decryption. A prominent one is RSA. We'll be using GPG to create RSA public/private key pairs which will then be used by Blackbox to handle encrypting/decrypting our secrets. The secrets are placed in version control.

> From this point on, "file" and "secret", will be used interchangably.

With respect to Blackbox, each user (or "admin" in Blackbox terms) registers their public key in Blackbox's public key ring. The public key ring is then used to encrypt files (secrets). Now whenever a user, e.g Alice, needs to decrypt a file, Alice can simply leverage her private key to decrypt the contents of the file. Blackbox will look for the corresponding private key automatically when trying to decrypt. Only the set of users who had registered their public key with Blackbox are able to decrypt the file. If Bob didn't register his public key in Blackbox's public key ring before the initial encryption of the file, he will not be able to decrypt.

> Blackbox uses GPG under the hood to encrypt/decrypt secrets. GPG leverages a hybrid cryptosystem (symmetric and asymmetric encryption) for securing secrets. For each secret, a "session" key is created which is in turn used to symmetrically encrypt each secret. Individually, the "session key" is encrypted using each admins's public key the encrypted value is stored in the final encrypted file. Each session key packet can only be decrypted by the respective public key's corresponding private key. Hence, to decrypt the secret, the correct session key packet is decrypted first and then the session key is used to decrypt the file using symmetric encryption. This is because symmetric encryption generally faster than asymmetric encryption. This is because Asymmetric encryption involves mathematical operations (e.g, exponentiation ) which are CPU intensive. Symmetric encryption generally involves constant time block ciphers.

### Containerizing Blackbox and GPG

We're going to create a container which has our desired version of GPG and Blackbox installed. We'll use this container to manage our secrets in a platform agnostic manner.

First, in terms of installing GPG on a container we have a couple options:

1. Create a Dockerfile based off a standard os image which already has GPG or additionally install GPG from a package manager. In that case **you should use it** assuming the version you require is available and maintained.
2. Create a Dockerfile where you compile your own version of GPG. This can be helpful for example if the next version causes breaking changes, and you still need some time to migrate. For exampple, the supported GPG version on your OS distribution is not the one your team is using at the moment. However, do note that you should still create a plan of action to migrate to the latest stable version!

We'll work through Option 2. We'll be creating a Dockerfile where we compile our own version of GPG and Blackbox.

### Installing GPG

We'll first learn how to compile and install a standalone instance of Gnupg. We'll start our Dockerfile with the individual steps to install and configure GPG. For our example, we'll be installing GPG `2.2.15`.

Let's begin. We'll be using `ubuntu:18.04` for our base image.

To start off, we also need to install the required dependencies which can build and install our libraries.

```Dockerfile
FROM ubuntu:18.04 as builder

## Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git-core \
    libncurses5-dev \
    libncursesw5-dev \
    zlib1g-dev && \
    apt-get clean && \
    rm -rf /var/cache/apt/* /var/lib/apt/lists/*
```

Now, we'll create the directory where we will install gpg and it's package dependencies. `/gpg-install`.

```Dockerfile
RUN mkdir gpg-install

WORKDIR /gpg-install

# Installation location of gpg and all gpg dependencies
ENV PREFIX=/gpg-install

```

> The environment variable `PREFIX` is declared here. It's value is `/gpg-install`. This environment variable will be used when we're compiling GPG and its dependencies. This shown after the following few steps.

Within this directory, `/gpg-install`, we'll start downloading each individual package including their `signatures`.
A `signature` is generated by computing the hash of the package archive and `Signing` this hash value with trusted private key(s).

> In other words, encrypt the computed hash value with a trusted private key. Typically SHA256 is used to compute the hash value. Signing provided authentication, we know this hash value was sent by a trusted person and not tampered with. The hash itself allows us to cross-check what we have downloaded now with the intended download (what the maintainers of the package actually published). If there is a mismatch, we have downloaded a tampered item.

We can verify the Signed Hash using a the corresponding Public Key of the Private key which was used to create the signature. With respect to Gnupg, the set of public keys used are from the project maintainers.

> You can find the set of trusted public keys [here](https://gnupg.org/signature_key.html)

The gnupg source and required libraries can be found [here](https://gnupg.org/download/index.html).

```Dockerfile
# Download all necessary packages and their signatures

RUN curl https://gnupg.org/ftp/gcrypt/libassuan/libassuan-2.5.2.tar.bz2  > libassuan-2.5.2.tar.bz2
RUN curl https://gnupg.org/ftp/gcrypt/libassuan/libassuan-2.5.2.tar.bz2.sig  > libassuan-2.5.2.tar.bz2.sig

RUN curl https://gnupg.org/ftp/gcrypt/libgcrypt/libgcrypt-1.8.4.tar.bz2  > libgcrypt-1.8.4.tar.bz2
RUN curl https://gnupg.org/ftp/gcrypt/libgcrypt/libgcrypt-1.8.4.tar.bz2.sig  > libgcrypt-1.8.4.tar.bz2.sig

RUN curl https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.35.tar.bz2  > libgpg-error-1.35.tar.bz2
RUN curl https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.35.tar.bz2.sig  > libgpg-error-1.35.tar.bz2.sig

RUN curl https://gnupg.org/ftp/gcrypt/libksba/libksba-1.3.5.tar.bz2  > libksba-1.3.5.tar.bz2
RUN curl https://gnupg.org/ftp/gcrypt/libksba/libksba-1.3.5.tar.bz2.sig  > libksba-1.3.5.tar.bz2.sig

RUN curl https://www.gnupg.org/ftp/gcrypt/npth/npth-1.6.tar.bz2 > npth-1.6.tar.bz2
RUN curl https://www.gnupg.org/ftp/gcrypt/npth/npth-1.6.tar.bz2.sig  > npth-1.6.tar.bz2.sig

RUN curl https://gnupg.org/ftp/gcrypt/pinentry/pinentry-1.1.0.tar.bz2  > pinentry-1.1.0.tar.bz2
RUN curl https://gnupg.org/ftp/gcrypt/pinentry/pinentry-1.1.0.tar.bz2.sig  > pinentry-1.1.0.tar.bz2.sig

RUN curl https://gnupg.org/ftp/gcrypt/gnupg/gnupg-2.2.15.tar.bz2  > gnupg-2.2.15.tar.bz2
RUN curl https://gnupg.org/ftp/gcrypt/gnupg/gnupg-2.2.15.tar.bz2.sig  > gnupg-2.2.15.tar.bz2.sig

```

Once the packages have been downloaded, we can now start to verify each package against its signature.

Now, we'll temporarily switch to a user which is created specifically for verifying our packages, this helps us keep our primary user's gnupg home directory in tact and prevents any corruption or un-intented updates from happening.

The user created is `gpg-verification-user`.

```Dockerfile
# Create a user only used for verifiying gpg
# ensures our root user's ~/.gnupg directory is not affected
RUN useradd --create-home --shell /bin/bash gpg-verification-user
USER gpg-verification-user
```

Once we have switched to this user, we can begin the verification process. The recommended method to verify is to use an existing, **trusted** gpg instance. Luckily, installing the `build-essential` package provided us with the latest trusted GnuPG installation instance. Or you can instead install it manually through `apt-get`.

> You can learn more about this integrity checking [here](https://gnupg.org/download/integrity_check.html).

We start by importing the set of public keys which are used to sign gnupg packages from a trusted key server.

> Typically you want to publish your public key to a trusted "key server" allowing anyone to access it.

Once that is complete, we can use the trusted gpg installation to verify each package individually. Gpg will essentially do the following: compute the `sha` hash of the package, then compare this against the signed hash value.

```Dockerfile
# Use trusted system gpg to verify the signauture of each package.

# Note we are verifying the gpg packages we want to install using a version of
# an already trusted gpg instance provided by our OS distribution.

# import GPG signing public keys from a trusted key server

# fingerprints retrieved from https://www.gnupg.org/signature_key.html
RUN gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys \
D8692123C4065DEA5E0F3AB5249B39D24F25E3B6 \
031EC2536E580D8EA286A9F22071B08A33BD3F06 \
46CC730865BB5C78EBABADCF04376F3EE0856959 \
5B80C5754298F0CB55D8ED6ABCEF7E294B092E28

# verify all signed packages
RUN gpg --verify libassuan-2.5.2.tar.bz2.sig libassuan-2.5.2.tar.bz2
RUN gpg --verify libgcrypt-1.8.4.tar.bz2.sig libgcrypt-1.8.4.tar.bz2
RUN gpg --verify libgpg-error-1.35.tar.bz2.sig libgpg-error-1.35.tar.bz2
RUN gpg --verify libksba-1.3.5.tar.bz2.sig libksba-1.3.5.tar.bz2
RUN gpg --verify npth-1.6.tar.bz2.sig npth-1.6.tar.bz2
RUN gpg --verify pinentry-1.1.0.tar.bz2.sig pinentry-1.1.0.tar.bz2
RUN gpg --verify gnupg-2.2.15.tar.bz2.sig gnupg-2.2.15.tar.bz2

```

For each verification step, you might see the following output:

```Dockerfile
gpg-verification-user@e0ff40f28981:/gpg-install$  gpg --verify npth-1.6.tar.bz2.sig npth-1.6.tar.bz2
gpg: Signature made Mon Jul 16 07:37:23 2018 UTC
gpg:                using RSA key D8692123C4065DEA5E0F3AB5249B39D24F25E3B6
gpg: Good signature from "Werner Koch (dist sig)" [unknown]
gpg: WARNING: This key is not certified with a trusted signature!
gpg:          There is no indication that the signature belongs to the owner.
Primary key fingerprint: D869 2123 C406 5DEA 5E0F  3AB5 249B 39D2 4F25 E3B6
```

In this case, the signature was valid, but the public keys were not marked as trusted. You can take some additional steps as mentioned in the GnuPG [Integrity Check](https://www.gnupg.org/download/integrity_check.html) page to either mark the keys as trusted or verify the fingerprint of the public key. On the other hand, if the command fails then the signature is not valid and you should double check the public keys used to verify or the packages were tampered with.

Once we have verified each package apart our GPG install, we can start the standalone installation process. We start off by switching back to our primary user, and running `configure` and `make` to install each dependency. Finally we install GnuPG after it's primary dependencies are installed.

```Dockerfile
# switch back to our root user
USER root
```

We'll start by installing core dependencies of GnuPG: `libgpg-error`, `libassuan`, `libgcrypt`, and `libksba`. We're passing `--prefix=$PREFIX` to the configure script to control where the library will be installed. The configure script is used to generate a make file for the current platform (our ubuntu base image).

The value of our environment variable `$PREFIX` is `/gpg-install`. Hence when `make install` is ran, the library will be installed in `/gpg-install` directory. `/gpg-install` will be the parent installation directory. Executable files of the package will be copied to `/gpg-install/bin`, library files will be copied to `/gpg-install/lib`, and header files will be copied to `/gpg-install/include`, and etc.

> Usually by default is the `--prefix` option has a value such as `/usr/local`.

```Dockerfile
## libgpg-error-1.35
RUN tar xjf libgpg-error-1.35.tar.bz2 && cd libgpg-error-1.35 && ./configure --prefix=$PREFIX && make && make install
```

> `make` will compile the library to generate the built files. `make install` will copy the built files from the build directory to the installation location.

`libgcrypt`, `libksba`, `libassuan` depend on `libgpg-error`, hence we also point them to the installation location of the `libgpg-error` which is: `/gpg-install`. This is done through the `--with-libgpg-error` option. Now these libraries can look up any files they need from `libgpg-error` under the `/gpg-install` directory.

Furthermore, we also ensure to install these libraries under the `/gpg-install` directory by passing the `--prefix` option to each libraries configure script.

```Dockerfile

## libassuan-2.5.2
RUN tar xjf libassuan-2.5.2.tar.bz2 && cd libassuan-2.5.2 && ./configure --prefix=$PREFIX --with-libgpg-error-prefix=$PREFIX && make && make install

## libgcrypt-1.8.4
RUN tar xjf libgcrypt-1.8.4.tar.bz2 && cd libgcrypt-1.8.4 && ./configure --prefix=$PREFIX --with-libgpg-error-prefix=$PREFIX && make && make install

## libksba-1.3.5
RUN tar xjf libksba-1.3.5.tar.bz2 && cd libksba-1.3.5 && ./configure --prefix=$PREFIX --with-libgpg-error-prefix=$PREFIX && make && make install

## npth-1.6
RUN tar xjf npth-1.6.tar.bz2 && cd npth-1.6 && ./configure --prefix=$PREFIX --with-libgpg-error-prefix=$PREFIX && make && make install
```

Our last dependency which we need to install is `pinentry`. This library is used for entering passwords in a secure manner when using GPG.

In terms of simplicilty and saving image space, we're only enabling the `TTY` and `CURSES` input modes of `pinentry`, we're disabling the other GUI based input modes. This is done through the `--enable-pinentry-tty`, `--enable-pinentry-curses`, `--disable-pinentry-qt`, `--disable-pinentry-gtk2`, and ``--disable-pinentry-gnome3` options.

We're passing the installation location of `libgpg-error` and `libassuan`, `/gpg-install`, through the `--with-libgpg-error-prefix` and `--with-libassuan-prefix` options. This will be used by `configure.sh` to ensure the proper files of the dependencies exist and various configuration related to them can be extracted for compliation purposes.

Because our `makefile` will have gcc dynamically link `libgpg-error` and `libassuan` which we installed in `/gpg-install`, we need to specify where these shared libraries can be found for the OS runtime loader.

This is done through the following option: `LDFLAGS="-Wl,--rpath=$PREFIX/lib"`. We're passing a `linker` option to `gcc` which adds `$PREFIX/lib` (`/gpg-install/lib`) to the runtime library search path.The library path is inserted into the header of the generated executable by the linker for the OS runtime loader to search through. The shared object files (`.so`) of `libgpg-error` and `libassuan` located at the `$PREFIX/lib` path (`/gpg-install/lib`) will be properly resolved by the OS runtime loader when `pinentry` is executed.

> By default the OS runtime loader will only look at predefined paths listed under `/etc/ld.so.confg`, which won't have `/gpg-install` as a path to search under for shared libraries, so we chose to insert this path into the executable so the runtime loader can resolve our libraries. Generally, with respect to dynamic linking, the compiler will at link time verify all functions and symbols required the program, then insert only the name of the library into the exectuable. At runtime the OS will look for this library based off the name and insert the library's contents into memory. It then connects the executable to this library by updating it with the proper memory addresses of the functions and symbols used. On the other hand, with respect to static linking, the compiler will insert contents of the library into the executable itself, and the executable will be initially built with the proper addresses to the library's functions and symbols used. The main benefit of dynamically linking is so that multiple executables could use the same shared library instead of each having it's own copy inserted into their respective executables, thus saving space.

> Note: to keep binary portable `--rpath` was chosen, however you could edit `/etc/ld.so.confg` and remove the use of `--rpath`.

```Dockerfile
## pinentry-1.1.0
RUN tar xjf pinentry-1.1.0.tar.bz2 && cd pinentry-1.1.0 && ./configure --prefix=$PREFIX \
  --with-gpg-error-prefix=$PREFIX \
  --with-libassuan-prefix=$PREFIX \
  --enable-pinentry-tty \
  --enable-pinentry-curses \
  --disable-pinentry-qt \
  --disable-pinentry-gtk2 \
  --disable-pinentry-gnome3 \
  LDFLAGS="-Wl,--rpath=$PREFIX/lib" \
  && make \
  && make install
```

Once all our core dependencies are installed, we can now install GPG. The following configuration flags are used: `--with-libgpg-error-prefix`, `--with-libgcrypt-prefix`, `--with-libassuan-prefix`, `--with-ksba-prefix`. This points the configuration script to do various dependency checks and look up appropriate files based on where we installed the dependencies of GPG (/`gpg-install`).

In addition, the makefile will dynamically link `libgpg-error`, `'libgcrypt`, `libnpth`, and `libassuan` to be used our `gpg` executable. Hence we include `LDFLAGS="-Wl,--rpath=$PREFIX/lib"`. We're passing a `linker` option to `gcc` which adds `$PREFIX/lib` (`/gpg-install/lib`) to the runtime library search path. The library path is inserted into the header of the generated executable by the linker for the OS runtime loader to search through. The shared object files of `libgpg-error`, `libgcrypt`, `libksba`, `libassuan` located at the `$PREFIX/lib` path (`/gpg-install/lib`) will be correctly found by the OS runtime loader when `gpg` is executed.

> We also have `--disable-dependency-tracking`. This is an optimization for one-time builds. Snippet from the [gnu make docs](https://www.gnu.org/software/automake/manual/html_node/Dependency-Tracking.html): "Dependency tracking is performed as a side-effect of compilation. Each time the build system compiles a source file, it computes its list of dependencies (in C these are the header files included by the source being compiled). Later, any time make is run and a dependency appears to have changed, the dependent files will be rebuilt." This is not needed for one time builds.

```Dockerfile
RUN tar xjf gnupg-2.2.15.tar.bz2 && cd gnupg-2.2.15 \
  && ./configure --prefix=$PREFIX \
      --disable-dependency-tracking \
      --prefix=$PREFIX \
      --with-libassuan-prefix=$PREFIX \
      --with-libgcrypt-prefix=$PREFIX \
      --with-npth-prefix=$PREFIX \
      --with-gpg-error-prefix=$PREFIX \
      --with-ksba-prefix=$PREFIX \
      LDFLAGS="-Wl,--rpath=$PREFIX/lib" \
  && make \
  && make install
```

Now we have installed our specific version GPG. It will be installed in the `/gpg-install` directory. The binary can be found in `/gpg-install/bin/gpg`.

Now that `gpg` is installed. Let's install `blackbox`.

```Dockerfile
RUN git clone https://github.com/StackExchange/blackbox.git && cd blackbox && make copy-install
```

> If you want to use a specific version or commit from Blackbox, you can also do that before installing.

At this point, we have installed `gpg` and `blackbox`. However, if you would build this container image, its size is probably very large, e.g) 500 mb. To reduce the size of the image, we're going to the Multi-Stage build feature of docker.

We now add a new `FROM` instruction to the docker file to create a new stage of the build by leveraging the Multi-Stage build feature of Docker. The last stage of the build is what is saved in the final image. Any intermediate stages and their artifacts are discarded. However, the key is that we can copy artifacts between stages.

> A snippet from [Docker Documentation](https://docs.docker.com/develop/develop-images/multistage-build/): With multi-stage builds, you use multiple FROM statements in your Dockerfile. Each FROM instruction can use a different base, and each of them begins a new stage of the build. You can selectively copy artifacts from one stage to another, leaving behind everything you don’t want in the final image.

In this new stage of our build, which is based on the same `ubuntu:18.04` image, we can copy over the previously built library and executable files.

```Dockerfile
FROM ubuntu:18.04 as runtime

RUN mkdir /gpg-install && \
  mkdir /gpg-install/bin && \
  mkdir /gpg-install/sbin && \
  mkdir /gpg-install/lib && \
  mkdir /gpg-install/libexec


# copy build gpg files to runtime stage
COPY --from=builder /gpg-install/bin/ /gpg-install/bin/
COPY --from=builder /gpg-install/sbin/ /gpg-install/sbin/
COPY --from=builder /gpg-install/lib/ /gpg-install/lib/
COPY --from=builder /gpg-install/libexec/ /gpg-install/libexec/

# copy over blackbox files to runtime stage
COPY --from=builder /usr/local/bin/blackbox* /usr/local/bin/

COPY --from=builder /usr/local/bin/_blackbox* /usr/local/bin/

COPY --from=builder /usr/local/bin/_stack_lib.sh /usr/local/bin/
```

Once we have copied over our built library and executable files, we need to install the necessary runtime dependecies.

```Dockerfile
## Install runtime dependencies
RUN apt-get update && apt-get install --no-install-recommends -y \
    git-core \
    libncurses5-dev \
    libncursesw5-dev \
    zlib1g-dev && \
    apt-get clean && \
    rm -rf /var/cache/apt/* /var/lib/apt/lists/*
```

Next, we append our `PATH` environment variable with the path to `/gpg-install/bin` to ensure that our shell will first look in the directory `/gpg-install/bin` when any command to `gpg` is made.

> Note: in this new stage of the build an existing version gpg is not already pre-installed since we don't install the `build-essential` package.

```Dockerfile
# Ensures any invocation of `gpg` resolves to our installed gpg instance (specific version)
ENV PATH $PATH:/gpg-install/bin
```

Finally, our gpg and blackbox installation is complete. However, we'll also have a docker entrypoint shell script to setup the environment for our secrets container. This is explained below.

```Dockerfile
# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT [ "/docker-entrypoint.sh" ]

# default command send to entry point. start the bash shell
CMD [ "bash" ]
```

## Overview of the secrets container and host system interaction using Docker Compose

Before we discuss our `docker-entrypoint` file which sets up the runtime environment for our secrets container, we'll map out the runtime filesystem the container will have based off our `docker-compose` configuration.

Since Blackbox commands will create git commits to our repository (e.g, adding a new secret with `blackbox_register_new_files` or adding a new admin `blackbox_addadmin`), we will also map our host git config onto the container.

```yaml
- ${HOME}/.gitconfig:/etc/gitconfig
```

Next, we will also mount the root directory which `gpg` will work in. In the `~/.gnupg` directory, `gpg` will store its public key ring, secret key rings files, and other information which it needs to do various operations. Notice that since we're using docker volumes, if `${HOME}/.gnupg` directory doesn't exist, it will be automatically created when the container is first started. If you want to or already are using the `${HOME}/.gnupg/` for other purposes, create a another directory specifically for our purposes, e.g) `${HOME}/.gnupg-blackbox/` , then map this as a volume to `/root/.gnupg/`

```yaml
- ${HOME}/.gnupg/:/root/.gnupg/
```

We're going to be using `docker-compose` to build and run our secrets container. So here's the full Docker Compose file.

```yaml
version: '3.4'
services:
  blackbox-containerized:
    build:
      dockerfile: Dockerfile-gpg-2-2-15
    command: ['bash']
    container_name: 'blackbox-containerized-gpg-2-2-15'
    environment:
    image: blackbox-containerized-gpg-2-2-15
    volumes:
      - ${HOST_GIT_CONFIG_PATH}:/etc/gitconfig
      - ${HOST_GPG_ROOT_DIRECTORY_PATH}/:/root/.gnupg/
```

### Initialzing the container with our `docker-entrypoint.sh` file

In the `docker-entrypoint.sh` file, we initialize `gpg-agent` and `pinentry` and print our `gpg` version information. `gpg-agent` is used to cache your key passwords. `pinentry` is used for password entry.

```shell
#!/bin/sh

if [ -f ~/.gnupg/.gpg-agent-info ]; then
  echo "=> Removing previous session's gpg agent info file."
  rm -f ~/.gnupg/.gpg-agent-info
fi

echo "=> Starting gpg-agent..."

# Set path to pin entry program (used for entering passwords)
echo 'pinentry-program /gpg-install/bin/pinentry-curses' > ~/.gnupg/gpg-agent.conf

# Start gpg agent
gpg-agent --daemon --write-env-file ~/.gnupg/.gpg-agent-info > /dev/null

# export the GPG_AGENT_INFO environment variable
# to prevent new gpg agents from being created repeatedly,
# and thus allowing us to cache passwords
if [ -f ~/.gnupg/.gpg-agent-info ]; then
    . ~/.gnupg/.gpg-agent-info
    export GPG_AGENT_INFO
fi

echo "=> gpg-agent started."

echo "=> gpg installation info:\n"

# print gpg version with 4 spaces indent
gpg --version | sed 's/^/    /'

echo '\n\n'

echo "=> entropy pool size on the system:"

cat /proc/sys/kernel/random/entropy_avail

echo "Initialization complete."
echo "========================\n\n"

exec "$@"
```

### Running the container

Run:

> `docker-compose -f docker-compose.yml build blackbox-containerized` 
> `docker-compose -f docker-compose.yml run blackbox-containerized`

### Conclusion

You now have a container running your desired version of GPG and Blackbox!

However, remember that if you have a managed secrets solution already available then you should always use it. Do not roll your own solution since secrets management involves both engineering and policy efforts. The solution needs to be robust and actively maintained in order to prevent security vulnerabilities. On the other hand, if you do not have a secrets management solution available, then one option is Blackbox.

## References

- https://stackoverflow.com/questions/9809213/what-are-a-and-so-files
- https://stackoverflow.com/questions/6562403/i-dont-understand-wl-rpath-wl
- https://thoughtbot.com/blog/the-magic-behind-configure-make-make-install
- https://askubuntu.com/questions/891835/what-does-prefix-do-exactly-when-used-in-configure
- https://en.wikipedia.org/wiki/Rpath
- https://homepages.inf.ed.ac.uk/imurray2/compnotes/library_linking.txt
- https://amir.rachum.com/blog/2016/09/17/shared-libraries/#runtime-search-path
- https://users.ece.cmu.edu/~adrian/630-f04/PGP-intro.html#p10
