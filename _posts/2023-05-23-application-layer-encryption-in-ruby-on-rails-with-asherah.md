---
layout: post
title: Implementing Application Layer Encryption in Ruby on Rails applications with Asherah
date: 2023-05-23
cover: /assets/images/ale-ruby/cover.jpg
options:
  - full-bleed-cover
excerpt: This article explores how we implement Application Layer Encryption in Ruby on Rails applications to protect customer-sensitive data with Asherah.
keywords: ruby, ruby on rails, application layer encryption, security
canonical: https://godaddy.com/resources/news/application-layer-encryption-in-ruby-on-rails-with-asherah
authors:
  - name: Dalibor Nasevic
    title: Sr. Principal Software Engineer
    url: https://dalibornasevic.com
    photo: https://avatars.githubusercontent.com/dalibor
---

The public cloud revolutionized the way we store and access data, but it also introduced new security challenges. This is because it involves sharing resources and infrastructure with multiple users, creating a risk of unauthorized access and data breaches. When we migrate our web services to the public cloud, in addition to storage layer data encryption and end-to-end encryption in transit, we implement application-layer encryption to protect customer-sensitive data like Personally Identifiable Information (PII). This article explores how the [Asherah](https://github.com/godaddy/asherah-ruby) Application Encryption SDK works and how we encrypt PII data in our Ruby on Rails applications.

## What is Application Layer Encryption and why do we need it?

Application Layer Encryption is the process of encrypting data by the application that received or generated the data. The data is encrypted before it is transported over a network or saved to a database, restricting access to the data only within the application's memory space. It differs from storage layer encryption, which can protect the data stored in a database when the server is powered off or the storage media is stolen. However, when the database server is running and authorized users or applications access the data, encryption at the storage layer is not sufficient to protect the data.

## What is Asherah and how does it work?

Asherah is an [application-layer encryption SDK](https://github.com/godaddy/asherah) developed by GoDaddy that uses envelope encryption and has a hierarchical data encryption model. At the top of the hierarchy, the master key is managed by a Hardware Security Module (HSM) or [Key Management Service (KMS)](https://github.com/godaddy/asherah/blob/master/docs/KeyManagementService.md#aws-kms). Below that, there are system and intermediate keys. At the lowest level, there are data row records that represent the individual encrypted rows.

![Key Hierarchy]({{site.baseurl}}/assets/images/ale-ruby/key_hierarchy.png)

The following is a brief overview of how the data and encrypted keys are stored at the data layer using a few sample data structures to illustrate the encryption pattern.
Note: Go to the [Asherah design and architecture page](https://github.com/godaddy/asherah/blob/master/docs/DesignAndArchitecture.md) for more information.

Let's say we have PII data that we want to encrypt, starting at the row level (or in Ruby on Rails terminology, at the model level). The Asherah SDK generates a data row key to encrypt that row data. The final payload that we need to store on the row level is named the data row record. It has a reference to its parent key called the intermediate key that is used to encrypt the data row key:

```json
{
  "Data": "<base64(encrypted_data)>",
  "Key": {
    "Created": 1534553138,
    "Key": "<base64(encrypted_key)>",
    "ParentKeyMeta": {
      "KeyId": "_IK_123_marketing_email",
      "Created": 1534553075
    }
  }
}
```

Asherah generates an intermediate key unless one already exists for the given partition. Partitions create a distinct chain of encryption keys and are a way to isolate the encrypted data and limit the blast radius. Usually, we choose the primary resource id for a partition id (i.e., `user_id`). The intermediate key envelope points to its parent key (the system key):

```json
{
  "Id": "_IK_123_marketing_email",
  "Created": 1534553075,
  "Key": "<base64(encrypted_key)>",
  "ParentKeyMeta": {
    "KeyId": "_SK_marketing_email",
    "Created": 1534553054
  }
}
```

Asherah generates a system key unless one exists or is expired. By default, system keys have a lifespan of 90 days, after which Asherah generates a new key. This action also initiates the creation of new intermediate keys. The `key_meta` in the system key envelope specifies the parent key used to encrypt it.

```json
{
  "Id": "_SK_marketing_email",
  "Created": 1534553054,
  "Key": "<base64(key_meta)>",
}
```

A parent key of the system key can be:

- A static key (used for testing only), or
- A HSM or KMS

When using AWS KMS, Asherah first generates a data key with it. This data key is the master key used to encrypt the system keys. The data key is encrypted by the KMS and stored in the `encryptedKek`. During a decrypt operation, the KMS initially decrypts the data key, which in turn decrypts the system key. The system key then decrypts the intermediate key, and the intermediate key decrypts the data row key. The data key is encrypted with multiple AWS regions to support a fallback when a region is unavailable.

```json
{
  "encryptedKey": "<base64(encrypted_key)>",
  "kmsKeks": [
    {
      "region": "<aws_region>",
      "arn": "<arn>",
      "encryptedKek": "<base64(key_encrypted_key)"
    },
    ...
  ]
}
```

The default cipher that Asherah uses for encryption is AES-256-GCM.

## Why not use AWS KMS directly?

You might wonder why we don’t use AWS KMS directly for each encrypt and decrypt operation. We can, but consider the following:

- Performance - it will cause increased latency with each encrypt or decrypt call to AWS KMS.
- Pricing - it will increase AWS KMS costs if we don't cache system keys and intermediate keys in memory and minimize AWS KMS calls.

## What is a Secure Memory?

Asherah implements [Secure Memory](https://github.com/godaddy/asherah/blob/master/docs/Internals.md#secure-memory) to safely generate, store, and cache encryption keys. By using a secure memory heap, it guards against memory leaks with swapping, core dumps, debugger memory scans, and CPU vulnerabilities like Spectre. A secure memory heap is not part of the language-managed memory, but it can be implemented using some known native calls.

To allocate secure memory, the following steps must be performed:
- check memory lock limit (getrlimit)
- allocate memory (mmap)
- disable swap (mlock)
- disable core dumps (madvise)
- write secret bytes to memory location
- set no access (mprotect)
- wipe secret bytes from managed memory

To read from secure memory, the following steps must be performed:
- change memory address to read-only mode (mprotect)
- read secret bytes from memory location
- change memory address to no access (mprotect)
- encrypt or decrypt with the secret
- wipe secret bytes from managed memory


## How to use Asherah in Ruby on Rails applications

[Asherah-Ruby](https://github.com/godaddy/asherah-ruby) is a Ruby FFI wrapper around the [Asherah Go](https://github.com/godaddy/asherah/tree/master/go) implementation of the application-layer encryption SDK. The Asherah Go implementation is exposed to Ruby via the [asherah-cobhan's Go wrapper](https://github.com/godaddy/asherah-cobhan/blob/main/libasherah.go) and compiled to a native shared library with [Cgo](https://pkg.go.dev/cmd/cgo). Currently supported platforms for Asherah Ruby are Linux and Darwin operating systems for x64 and ARM64 CPU architectures.

To configure the Asherah library in a Ruby on Rails application, we must first install the [Asherah](https://rubygems.org/gems/asherah) gem. After installing the gem, we need to create the following migration for the `encryption_key` table to store the system and intermediate keys. Asherah supports MySQL and DynamoDB [metastores](https://github.com/godaddy/asherah/blob/master/docs/Metastore.md), and can be extended to support additional adapters. For our test, we will use MySQL.

```ruby
class CreateEncryptionKey < ActiveRecord::Migration[7.0]
  def up
    execute("
      CREATE TABLE encryption_key (
        id             VARCHAR(255) NOT NULL,
        created        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        key_record     TEXT         NOT NULL,
        PRIMARY KEY (id, created),
        INDEX (created)
      );
    ")
  end

  def down
    drop_table :encryption_key
  end
end
```

We have to create an initializer to configure Asherah. To do so, we set the `service_name` and `product_id` used for the key naming. We configure `metastore`, and `connection_string` for the keys storage. We need a separate `connection_string` from the default Active Record connection because Asherah Go manages the connection for writing and reading the encrypted keys. Then we configure `enable_session_caching` for performance and specify the `kms` details. We use a static key in development and test environments, and in the production environment, we use the AWS KMS service. Here is the Asherah configuration:

```ruby
Asherah.configure do |config|
  config.service_name = 'marketing'
  config.product_id = 'email'
  config.metastore = 'rdbms'
  config.enable_session_caching = true # default: false

  c = ActiveRecord::Base.connection_db_config.configuration_hash
  config.connection_string = "#{c[:username]}:#{c[:password]}@tcp(#{c[:host]}:#{c[:port]})/#{c[:database]}"

  if ENV['ASHERAH_KMS_ENABLED'] == 'true'
    config.kms = 'aws'
    config.preferred_region = ENV.fetch('AWS_REGION')
    config.region_map = { ENV.fetch('AWS_REGION') => ENV.fetch('KMS_KEY_ARN') }
  elsif Rails.env.development? || Rails.env.test?
    config.kms = 'static' # The static key used for encryption is `thisIsAStaticMasterKeyForTesting` (defined in Asherah Go)
  else
    raise "Asherah client not configured for: #{Rails.env}"
  end
end
```

Once we have all that set, we can call the `encrypt` and `decrypt` operations with Asherah:

```ruby
partition_id = 'user_1'
data = 'user@example.com'
encrypted_data = Asherah.encrypt(partition_id, data)
decrypted_data = Asherah.decrypt(partition_id, encrypted_data)
```

## How to integrate Asherah in Ruby on Rails models

In Ruby on Rails models, we frequently use open schema columns of type `text` and leverage [ActiveRecord::Store](https://api.rubyonrails.org/classes/ActiveRecord/Store.html) with JSON serialization. That way, we store data without having to run migrations for each new column we add. We’ll start by creating the table `users` with text column `params` to store personally identifiable information like `name` and `email`. Let's create the migration:

```ruby
class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.text :params
      t.timestamps
    end
  end
end
```

Each model that implements application layer encryption needs to include the `DataEncryption` module we'll define below. This module defines the `data_encryption` method used to specify the encrypted attributes' `name` and `email` and how we reference them from the model. For the `partition_id`, we use the `global` value, but if we had a parent account model, we could partition by the `account_id.` Next, we'll define the `User` model:

```ruby
class User < ActiveRecord::Base
  include DataEncryption

  store :params, accessors: [:enc_data], coder: JSON
  data_encryption :raw_data, :enc_data, store_name: :params, accessors: [:name, :email]

  private
  def partition_id
    'global'
  end
end
```

The `DataEncryption` module defines `before_save` and `after_find` callbacks to ensure proper encryption and decryption of data when models are saved or retrieved from the database. The models that include it must define the `partition_id` for the encryption session. The `data_encryption` method expects the following arguments:

- `raw_data` - a virtual attribute that holds the raw data
- `enc_data` - an attribute to store the encrypted data
- `store_name` - the name of the store where `enc_data` will be stored

Next, we will define the `DataEncryption` module:

```ruby
module DataEncryption
  extend ActiveSupport::Concern

  DataEncrypt = Struct.new(:raw_attr_name, :enc_attr_name, :store_name)

  included do
    class_attribute :data_encrypt, default: nil
    before_save :encrypt_data_callback
    after_find :decrypt_data_callback
  end

  class_methods do
    def data_encryption(raw_attr_name, enc_attr_name, store_name: , accessors: [])
      self.data_encrypt = DataEncrypt.new(raw_attr_name, enc_attr_name, store_name)

      attribute raw_attr_name, default: -> { HashWithIndifferentAccess.new }

      accessors.each do |accessor|
        define_method(accessor) do
          public_send(raw_attr_name)[accessor]
        end

        define_method("#{accessor}=") do |value|
          public_send(raw_attr_name)[accessor] = value
        end
      end
    end
  end

  private
  def encrypt_data_callback
    data = public_send(data_encrypt.raw_attr_name)

    if data.present? || public_send(data_encrypt.enc_attr_name).present?
      public_send("#{data_encrypt.enc_attr_name}=", encrypt_data(data))
    end
  end

  def decrypt_data_callback
    enc_data = public_send(data_encrypt.enc_attr_name)

    if enc_data.present?
      data = decrypt_data(enc_data)
      data = ActiveRecord::Store::IndifferentCoder.as_indifferent_hash(data)
      public_send("#{data_encrypt.raw_attr_name}=", data)
    end
  end

  def encrypt_data(data)
    Asherah.encrypt(partition_id, JSON.dump(data))
  end

  def decrypt_data(enc_data)
    JSON.parse(Asherah.decrypt(partition_id, enc_data))
  end
end
```

## How to search encrypted PII data

Our PII data is encrypted and stored in the database, but we can't search for it because it is not indexed. One way to implement a search for encrypted PII data is to use a cryptographic technique called a blind index. Blind indexes are created by applying a one-way cryptographic hash function to the data, generating a unique fixed-length string that represents the data without revealing the actual content. To further enhance the security of the hashed data, we use a pepper, a secret key added to the input of the hashing function to create a peppered hash. Next, we'll define the hashing function:

```ruby
class Hasher
  def self.hash(value)
    Digest::SHA256.hexdigest(value.downcase + ENV.fetch('HASHING_PEPPER'))
  end
end
```

To implement a blind index, we will add a column named `hashed_email` with an index to the table `users`. That way, we'll be able to search for an exact match of the hashed email (though we still can't do a full-text search or use LIKE queries). Next, we'll add the migration:

```ruby
class AddHashedEmailToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :hashed_email, :string
    add_index :users, :hashed_email
  end
end
```

We can then add a `before_validation` callback to our model to hash the data for the PII columns and define helper class methods like `find_by_email`. Finally, we'll extend the `User` model with the following code:

```ruby
class User < ActiveRecord::Base
  before_validation :hash_pii_columns

  def self.find_by_email(email)
    where(hashed_email: Hasher.hash(email)).take
  end

  private
  def hash_pii_columns
    self.hashed_email = Hasher.hash(email) if email.present?
  end
end
```

## Important considerations for production deployments of Asherah-Ruby

The following are some things to consider before deploying Asherah-Ruby to production:

- The minimal overhead is about 33% of the payloads due to Base64 encoding of encrypted data.
- Warm up Asherah with a dummy encrypt call to decrypt the master key with KMS and cache it in memory before handling any requests:
  ```ruby
  Rails.configuration.after_initialize do
    Asherah.encrypt('global', 'warmup')
  end
  ```
- Use glibc-based Linux distributions because the Go standard library has incompatibility and causes C-shared builds to [fail with musllibc](https://github.com/golang/go/issues/13492).
- You might need to pass ENV variables from Ruby to Go as with the `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` ENV var when running in AWS Fargate containers. Go `os.Getenv()` does not see variables set by C.setenv() as reported in this [issue](https://github.com/golang/go/issues/44108) and documented in the [wiki](https://github.com/golang/go/wiki/cgo#environmental-variables).
  ```ruby
  AWS_ECS_ENV_VAR_NAME = 'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI'
  Asherah.set_env(AWS_ECS_ENV_VAR_NAME => ENV.fetch(AWS_ECS_ENV_VAR_NAME)) if ENV[AWS_ECS_ENV_VAR_NAME].present?
  ```

## Conclusion

[Asherah](https://github.com/godaddy/asherah)'s cross-language support, secure memory management, and granularity with the hierarchical key encryption model are some of the key features that help us minimize attack exposure and increase the security of our customer data. [Revoking keys](https://github.com/godaddy/asherah/blob/master/docs/Internals.md#ttl-and-expiredrevoked-keys) due to a suspected compromise is also built into the key rotation model. We have been using Asherah successfully in production for a few years now. We've iterated through a few different distributions of it for Ruby projects specifically, using an Asherah Go sidecar, a pure Ruby implementation of Asherah, and finally landing on [Asherah-Ruby](https://github.com/godaddy/asherah-ruby) that's using Asherah Go under the hood. With version 7 of Ruby on Rails, we saw the light of the built-in [Active Record Encryption](https://guides.rubyonrails.org/active_record_encryption.html) for encrypting data at the application layer. It's great to see more alternative solutions bringing their features and advantages.

_Cover Photo Attribution: Photo by <a href="https://unsplash.com/@glenncarstenspeters?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Glenn Carstens-Peters</a> on <a href="https://unsplash.com/photos/tagHjCxTHEw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>_
