# Deduplicate assets without downloading them

The same image is referenced from five places and served at four widths. Counting
references tells you how busy the markup is. You need the number of **files** to
re-host.

Downloading everything to hash it costs gigabytes of someone else's bandwidth to answer
a question that fits in a few kilobytes of headers.

## Layer 1 — canonicalize the URL

Framer serves responsive variants by query parameter:

```
https://framerusercontent.com/images/AbC123.jpg?scale-down-to=512
https://framerusercontent.com/images/AbC123.jpg?scale-down-to=1024
https://framerusercontent.com/images/AbC123.jpg
```

Three URLs, one file. Strip `scale-down-to`, `width`, `height` and they collapse before
anything is fetched. Free, and it does most of the work — a single `srcset` can
contribute five references to one image.

Result: distinct URLs. Not yet distinct files.

## Layer 2 — compare `ETag`

Different URLs can still serve identical bytes — the same picture uploaded twice, into
two collections or two site folders.

Both platforms sit on S3-compatible storage, where a normally-uploaded object gets an
`ETag` equal to the **MD5 of its content**. So `HEAD` yields a content hash for free:

```console
$ curl -sI 'https://cdn.prod.website-files.com/…/663a3f00…_mk-2-unsplash.webp'
HTTP/2 200
content-type: image/webp
content-length: 56046
etag: "6f7d022556d3ff514b54e0b2672773d1"
```

Same `ETag` + same origin = same bytes. Group, keep the first, mark the rest duplicates.

Verified, not assumed — downloading that object and hashing it returns
`6f7d022556d3ff514b54e0b2672773d1`. The `ETag` exactly.

## Which layer catches what

The split is platform-shaped, and predictable:

- **Framer** — layer 2 catches close to nothing. One upload is addressed by one path,
  so its duplicates are responsive variants, and variants already died in layer 1.
- **Webflow** — layer 2 earns its keep. The recurring case is one image sitting under
  two different site-folder identifiers: two URLs, one `ETag`, one file.
