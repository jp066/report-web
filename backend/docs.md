## Dependency

> Em linguagem simples:
- é uma função (ou classe) que faz um trabalho comum, por exemplo:
    - abrir conexão com DB
    - validar JWT
    - carregar usuario logado
- É parecido com um "middleware", mas aqui vai algumas diferenças:
    | Middleware | Dependency |
    |------------|-------------|
    | Executa antes de todas as rotas | Executa apenas nas rotas que você definir |
    | Pode modificar request/response | Não pode modificar request/response |
    | Geralmente usado para tarefas globais | Usado para tarefas específicas de rotas |


## OAuth2PasswordBearer

> Em linguagem simples:
- é uma classe que ajuda a extrair o token de autenticação do cabeçalho HTTP
- você cria uma instância dela e usa como dependência nas suas rotas
- ela procura o token no cabeçalho "Authorization" com o esquema "Bearer"
- se o token estiver presente, ela retorna o token para você usar na rota
- se o token estiver ausente, ela levanta um erro 401 automaticamente

### Exemplo de uso
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") ## essa url é onde o cliente pode obter o token
async def get_current_user(token: str = Depends(oauth2_scheme)): ## aqui usamos a dependência
    if not verify_token(token): ## se o token for inválido
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return get_user_from_token(token)
```
