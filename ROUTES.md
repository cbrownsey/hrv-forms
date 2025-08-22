# Users

## `GET /users`

### Response
- `200 OK`
  ```
  {
    id: string,
    name: string,
    email: string,
    activated: bool,
  }[]
  ```

## `GET /user/:user_id`

### Response
- `200 OK`
  ```
  {
    id: string,
    name: string,
    email: string,
    activated: bool,
  }
  ```

## `POST /user/:user_id`

### Body
```
{
  name: string,
  email: string,
}
```

### Response
- `200 OK`
  The body of this response is the newly created user's public id.