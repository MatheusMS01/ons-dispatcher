O sistema consiste em prover uma interface simplificada ao usuário e automatizar as simulações a partir de uma estrutura dispatcher-worker. 

O sistema autentica um usuário, gerando um identificador único para ele. A partir deste identificador, cria-se um diretório *scratch*, responsável por persistir os dados da simulação.

Cada máquina cliente executa uma instancia de *worker* e necessita estar conectada à mesma rede do dispatcher. Essa máquina identifica-se dinamicamente ao servidor dispatcher a partir de um protocolo similar ao DHCP.

O dispatcher, ao receber um pacote *discovery* de um worker, guarda suas informações em memória. Ao receber uma requisição do usuário, o dispatcher envia um pacote a cada worker descoberto, perguntando quais máquinas possuem recursos suficientes para executar uma nova simulação. Os clientes calculam essa informação a partir da memória em uso, porcentagem de CPU e o custo médio(se houver) da execução de um processo simulador. O dispatcher envia então o simulador e  o arquivo de configuração para até cinco workers, se houver, informando o identificador do usuário.

O worker, ao receber uma requisição, inicializa um novo processo com o simulador e espera um sinal de término. Se o retorno do processor for diferente de 0, significa que ocorreu um erro durante a simulação.