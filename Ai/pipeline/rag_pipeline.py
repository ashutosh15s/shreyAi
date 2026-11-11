"""
RAG Pipeline Architecture for Shrey AI.
Manages document chunking, vector embedding, and ChromaDB similarity search.
"""

import os
from typing import List, Dict, Any, Optional
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter


class RagPipeline:
    """
    Class-based RAG pipeline handling local document ingestion and retrieval.
    """

    def __init__(self, persist_directory: Optional[str] = None):
        self.persist_dir = persist_directory or os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=600,
            chunk_overlap=80,
            separators=["\n\n", "\n", " ", ""]
        )
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(name="shrey_knowledge")

    def ingest_text(self, text: str, source: str = "user_input", metadata: Optional[Dict[str, Any]] = None) -> int:
        """
        Split and ingest text into ChromaDB vector store.
        Returns the number of ingested chunks.
        """
        if not text or not text.strip():
            return 0

        chunks = self.splitter.split_text(text)
        if not chunks:
            return 0

        ids = [f"{source}_{i}_{hash(chunk)}" for i, chunk in enumerate(chunks)]
        metadatas = [dict(metadata or {}, source=source, chunk_index=i) for i in range(len(chunks))]

        self.collection.add(
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )
        return len(chunks)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Query vector store for top-k semantically relevant chunks.
        """
        if not query or not query.strip():
            return []

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )

            documents = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0] if "distances" in results else []

            output = []
            for i, doc in enumerate(documents):
                output.append({
                    "content": doc,
                    "metadata": metadatas[i] if i < len(metadatas) else {},
                    "score": distances[i] if i < len(distances) else None
                })
            return output
        except Exception:
            return []

