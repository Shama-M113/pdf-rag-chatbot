from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import shutil
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

from langchain_community.llms import HuggingFacePipeline
from transformers import pipeline

# ==========================================================
# FASTAPI APP
# ==========================================================

app = FastAPI()

qa_chain = None

# Create folders if not present
os.makedirs("pdfs", exist_ok=True)
os.makedirs("faiss_index", exist_ok=True)


# ==========================================================
# PDF LOADING + CHUNKING
# ==========================================================

def load_and_chunk(pdf_path):
    loader = PyPDFLoader(pdf_path)

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)

    print(f"Total chunks: {len(chunks)}")

    return chunks


# ==========================================================
# VECTOR STORE
# ==========================================================

def build_vector_store(chunks):

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )

    vector_store = FAISS.from_documents(
        chunks,
        embeddings
    )

    vector_store.save_local("faiss_index")

    print("FAISS index saved")

    return vector_store


# ==========================================================
# QA CHAIN
# ==========================================================

def load_qa_chain():

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )

    vector_store = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

    pipe = pipeline(
        "text2text-generation",
        model="google/flan-t5-large",
        max_new_tokens=256
    )

    llm = HuggingFacePipeline(
        pipeline=pipe
    )

    prompt_template = """
You are a helpful assistant.

Answer the question using the provided context.

If the user asks:
- What is this document about?
- Summarize the document

Provide an overall summary instead of focusing on a single section.

Context:
{context}

Question:
{question}

Answer:
"""

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vector_store.as_retriever(
            search_kwargs={"k": 5}
        ),
        chain_type="stuff",
        chain_type_kwargs={
            "prompt": prompt
        }
    )

    return qa_chain


# ==========================================================
# REQUEST MODEL
# ==========================================================

class Question(BaseModel):
    question: str


# ==========================================================
# PDF UPLOAD API
# ==========================================================

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    filepath = f"pdfs/{file.filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks = load_and_chunk(filepath)

    build_vector_store(chunks)

    global qa_chain
    qa_chain = load_qa_chain()

    return {
        "message": "PDF indexed successfully",
        "chunks": len(chunks)
    }


# ==========================================================
# ASK QUESTION API
# ==========================================================

@app.post("/ask")
async def ask_question(body: Question):

    global qa_chain

    if qa_chain is None:
        return {
            "error": "Upload a PDF first"
        }

    response = qa_chain.invoke(
        {"query": body.question}
    )

    return {
        "answer": response["result"]
    }


# ==========================================================
# HOME ROUTE
# ==========================================================

@app.get("/")
def home():
    return {
        "message": "PDF RAG Chatbot Running"
    }