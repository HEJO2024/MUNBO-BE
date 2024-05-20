#!pip install -q langchain openai faiss-cpu langchainhub pypdf chromadb tiktoken

#from langchain.embeddings import OpenAIEmbeddings
#from langchain.vectorstores import FAISS
import csv
import re
import json
import os
from langchain.prompts import FewShotPromptTemplate, ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.callbacks import get_openai_callback
import sys

from dotenv import load_dotenv
load_dotenv()  # .env 파일 로드
api_key = os.getenv("GPT_API_KEY")

os.environ["OPENAI_API_KEY"] = api_key

input_file = './src/2022_1_for_test.csv'
output_format = {"input": "", "output": ""}
results = []

with open(input_file, 'r', encoding='cp949') as file:
    reader = csv.reader(file)
    next(reader)
    for row in reader:
        question = row[1]
        choices = [row[2], row[3], row[4], row[5]]
        answer = row[6]
        keyword = row[8]
        output_data = f"{question}\n A){choices[0]}\n B){choices[1]}\n C){choices[2]}\n D){choices[3]} \n Answer){answer}"
        result = output_format.copy()
        result["input"] = keyword
        result["output"] = output_data
        results.append(result)

admin_prompt = """
"""

with open("./src/testQuiz_prompt.txt", "r", encoding='utf-8') as f:
    admin_prompt = f.read()
token_usage=0

examples = results
example_prompt = ChatPromptTemplate.from_messages([("human", "{input}"), ("ai", "{output}")])
few_shot_prompt = FewShotChatMessagePromptTemplate(example_prompt=example_prompt, examples=examples)
final_prompt = ChatPromptTemplate.from_messages([("system", admin_prompt), few_shot_prompt, ("human", "{input}")])

model = ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=1024)
parser = StrOutputParser()
chain = final_prompt | model | parser

text = """
먼저 플래시 메모리는 어떤 메모리이고 앞서 설명했던 DRAM, SRAM과는 어떤 차이가 있을까? 가장 중요한 차이점이라고 한다면 플래시 메모리는 전원이 꺼져도 정보가 남아있는 비휘발성 메모리라는 점이다. 이런 점에서 ROM과 비슷하다고 할 수 있고, 특히 그 중에서도 EEPROM과 유사한 메모리라고 말할 수 있다. 일단은 ROM이나 EEPROM이 무엇인지 몰라도 플래시 메모리의 구조가 어떻게 되어있고, 어떤 방식으로 정보를 기록하고 읽어내는지 알아보도록 하자. 
 플래시 메모리도 RAM들과 마찬가지로 cell이라는 단위로 구성된다. DRAM이나 SRAM의 경우에는 1개의 cell에 1비트의 정보를 저장했다면(이런 경우 Single Level Cell의 줄임말로 SLC라 부른다), 플래시메모리는 1비트의 정보를 저장할 수도 있고, 좀 더 많은 비트의 정보를 저장할 수 도 있다(이 경우는 Multi Level Cell의 줄임말인 MLC라고 부른다. 일반적으로 2비트를 저장하는 cell을 부르는 말). 이에 대해서는 조금 있다가 살펴보고, 먼저 이 1개 cell의 구조를 살펴보자.
Flash cell의 구조
위 그림은 플래시 메모리에서 1개 cell의 구조를 나타낸다. 이전 포스팅에서 본 그림이 떠오를 것이다. 그리고 소스, 게이트, 드레인 이 단어들을 본다면 떠올리지 않을 수 없는 것이 있다. 바로 트랜지스터이다. 트랜지스터와 똑 빼닮은 위의 구조를 봤을 때 다른점이 하나 있다면 원래 게이트가 있을 자리에 floating gate라는 새로운 층이 하나가 추가되었다는 것이다. 말 그대로 중간에 떠있는(floating) 게이트라고 할 수 있는데, 쉽게 말하면 이 floating gate에 전자를 '잡아놓아서' 전원이 꺼져도 정보가 남아있게 할 수 있는 것이다. 그리고 어떻게 이 곳에 전자를 잡아두고, 내보내는지는 contorl gate가 결정하게 된다. 이제 정보를 read 하고 write 하는 과정을 자세히 살펴보자. 
"""
keyword = '메모리'

with get_openai_callback() as cb:
    made_quiz = chain.invoke({"input": text})
    token_usage=cb.total_tokens
    #print(made_quiz)
    #print(f"Total cost: {cb.total_cost}")
    # print(f"Successful requests: {cb.successful_requests}")
    # print(f"Prompt tokens: {cb.prompt_tokens}")
    # print(f"Completion tokens: {cb.completion_tokens}")

def parse_questions(text):
    questions = []
    question_pattern = re.compile(r"(?:Q\d+: )?(.+?)\n+\s*A[.)]\s*(.+?)\n+\s*B[.)]\s*(.+?)\n+\s*C[.)]\s*(.+?)\n+\s*D[.)]\s*(.+?)\n+\s*Answer[):.]?\s*(.+?)\n+\s*Explanation[):.]?\s*(.+?)(?=\n+(?:Q\d+: )|$)", re.DOTALL)
    matches = question_pattern.findall(text)
    for match in matches:
        question = {
            "question": match[0],
            "options": [match[1], match[2], match[3], match[4]],
            "answer": match[5],
            "explanation": match[6],
            "key": keyword
        }
        questions.append(question)
    return questions

quizData = parse_questions(made_quiz)
print(quizData)
print(token_usage)