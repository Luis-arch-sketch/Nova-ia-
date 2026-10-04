# Componentes de terceiros

A interface é identificada como NOVA IA. A inferência local utiliza pesos existentes, sem treinamento próprio e sem um serviço externo de inferência.

- Runtime: [Transformers.js 3.8.1](https://github.com/huggingface/transformers.js), licença Apache 2.0.
- Execução: [ONNX Runtime](https://github.com/microsoft/onnxruntime), licença MIT.
- Pesos: [Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B), licença Apache 2.0, convertidos pelo projeto [ONNX Community](https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX).
- Revisão dos pesos: `da1453100cf3ff33ef56d17983fc7a8648706db6`.

Os pesos e o tokenizador são baixados diretamente do repositório público e armazenados no cache do navegador. As mensagens são processadas no aparelho. Não há chave de API nem envio de conversas para um provedor de inferência. O desempenho e o espaço necessário dependem do aparelho; um modelo pequeno pode cometer erros.
