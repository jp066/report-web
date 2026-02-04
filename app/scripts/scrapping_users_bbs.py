import requests

ENDPOINT = "https://bbsltda149898.rm.cloudtotvs.com.br:8051/api/framework/v1/users?pageSize=100000000000000"
USER = "mestre"
PASSWORD = "123t0tvs"


def buscar_usuarios_com_brightbee():
    response = requests.get(ENDPOINT, auth=(USER, PASSWORD))
    response.raise_for_status()
    data = response.json()

    # Verificar o tipo de dado retornado
    if isinstance(data, str):
        print(f"Erro: API retornou uma string ao invés de JSON: {data[:200]}")
        return []

    # Se for um dicionário, pode ter uma chave com a lista de usuários
    if isinstance(data, dict):
        # Tenta encontrar a lista de usuários em possíveis chaves
        data = data.get('users', data.get('data', data.get('items', [])))

    # Garantir que data é uma lista
    if not isinstance(data, list):
        print(f"Erro: Formato inesperado. Tipo recebido: {type(data)}")
        print(f"Conteúdo: {data}")
        return []

    filtrados = []

    for usuario in data:
        if not isinstance(usuario, dict):
            print(f"Aviso: Item não é um dicionário: {usuario}")
            continue

        emails = usuario.get('emails', [])
        for email_info in emails:
            if isinstance(email_info, dict) and '@brightbee.com.br' in email_info.get('value', ''):
                filtrados.append(usuario)
                break

    return filtrados


usuarios_brightbee = buscar_usuarios_com_brightbee()

with open("usuarios_brightbee.txt", "w", encoding="utf-8") as f:
    f.write(f"Encontrados: {len(usuarios_brightbee)} usuários com e-mail @brightbee.com.br\n")
    for usuario in usuarios_brightbee:
        f.write(f"{usuario}\n")
