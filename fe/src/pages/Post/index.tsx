import React from 'react';
import { observer } from 'mobx-react-lite';
import Viewer from 'react-viewer';
import marked from 'marked';
import WaitingForFeed from 'components/WaitingForFeed';
import BackButton from 'components/BackButton';
import Button from 'components/Button';
import Loading from 'components/Loading';
import ButtonOutlined from 'components/ButtonOutlined';
import Fade from '@material-ui/core/Fade';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ThumbUp from '@material-ui/icons/ThumbUp';
import Badge from '@material-ui/core/Badge';
import classNames from 'classnames';
import { getPostId } from 'store/feed';
import RewardSummary from './rewardSummary';
import RewardModal from './rewardModal';
import Comment from './comment';
import { useStore } from 'store';
import { ago, isPc, isMobile, sleep } from 'utils';
import FeedApi from './api';
import Api from 'api';

import 'react-viewer/dist/index.css';
import './github.css';

marked.setOptions({
  highlight: (code: string) => {
    return require('highlight.js').highlightAuto(code).value;
  },
});

export default observer((props: any) => {
  const { feedStore, userStore, modalStore } = useStore();
  const { isLogin } = userStore;
  const { currentPost: post, isFetched: isFetchedFeed } = feedStore;
  const [pending, setPending] = React.useState(true);
  const [voting, setVoting] = React.useState(false);
  const [showImage, setShowImage] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState('');
  const [openRewardModal, setOpenRewardModal] = React.useState(false);
  const [isFetchedReward, setIsFetchedReward] = React.useState(false);
  const [toAddress, setToAddress] = React.useState('');
  const [authorMixinClientId, setAuthorMixinClientId] = React.useState('');
  const [rewardSummary, setRewardSummary] = React.useState({ amountMap: {}, users: [] });
  const noReward = rewardSummary.users.length === 0;

  React.useEffect(() => {
    (async () => {
      if (post) {
        const blocks = await FeedApi.getBlocks(post.id);
        const block = blocks[0];
        const toAddress = block.user_address;
        const { payment_url } = JSON.parse(block.meta);
        const mixinClientId = payment_url ? payment_url.split('/').pop() : '';
        setToAddress(toAddress);
        setAuthorMixinClientId(mixinClientId);
      }
    })();
  }, [post]);

  React.useEffect(() => {
    (async () => {
      if (isFetchedFeed) {
        await sleep(800);
        setPending(false);
      }
    })();
  }, [isFetchedFeed]);

  React.useEffect(() => {
    const { postId } = props.match.params;
    feedStore.setPostId(decodeURIComponent(postId));
  }, [props, feedStore]);

  React.useEffect(() => {
    if (post) {
      const { title } = post;
      document.title = `${title} - 飞帖`;
    }
  });

  React.useEffect(() => {
    (async () => {
      if (post && post.id === props.match.params.postId) {
        try {
          const rewardSummary = await FeedApi.getRewardSummary(post.id);
          setRewardSummary(rewardSummary);
        } catch (err) {}
        setIsFetchedReward(true);
      }
    })();
  }, [post, props]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const bindClickEvent = (e: any) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        window.open(href);
        e.preventDefault();
      } else if (e.target.tagName === 'IMG') {
        if (isMobile) {
          return;
        }
        setImgSrc(e.target.src);
        setShowImage(true);
      }
    };

    setTimeout(() => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindClickEvent);
      }
    }, 2000);

    return () => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindClickEvent);
      }
    };
  }, []);

  const onCloseRewardModal = async (isSuccess: boolean) => {
    setOpenRewardModal(false);
    if (isSuccess) {
      await sleep(800);
      const rewardSummary = await FeedApi.getRewardSummary(post.id);
      setRewardSummary(rewardSummary);
    }
  };

  if (!feedStore.isFetched) {
    return null;
  }

  if (pending) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  const backToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      window.scroll(0, 0);
    }
  };

  const reward = () => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    setOpenRewardModal(true);
  };

  if (!post) {
    return <WaitingForFeed />;
  }

  const RewardView = () => {
    if (!isFetchedReward) {
      return (
        <div className="py-24">
          <Loading />
        </div>
      );
    }
    return (
      <div>
        <div className="text-center pb-6 md:mt-5">
          <div className="hidden md:block">
            <Button onClick={reward}>赞赏</Button>
          </div>
          {noReward && (
            <div className="mt-5 text-gray-600 pb-5">还没有人赞赏，来支持一下作者吧！</div>
          )}
        </div>
        {!noReward && <RewardSummary summary={rewardSummary} />}
        {!noReward && <div className="mt-8 pb-4 md:border-none border-t border-gray-300" />}
      </div>
    );
  };

  const CommentView = () => {
    if (!isFetchedReward) {
      return null;
    }
    return (
      <div className="pb-10">
        <Comment fileRId={post.id} alwaysShowCommentEntry={post.content.length < 500} />
      </div>
    );
  };

  const createVote = async (postId: string) => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    if (voting) {
      return;
    }
    setVoting(true);
    const post = await Api.createVote({
      objectType: 'posts',
      objectId: postId,
      type: 'UP',
    });
    feedStore.updatePostExtraMap(post.fileRId, post);
    setVoting(false);
  };

  const resetVote = async (postId: string) => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    if (voting) {
      return;
    }
    setVoting(true);
    const post = await Api.deleteVote({
      objectType: 'posts',
      objectId: postId,
    });
    feedStore.updatePostExtraMap(post.fileRId, post);
    setVoting(false);
  };

  const VoteView = (postId: string, extra: any = {}) => {
    return (
      <div
        className={classNames(
          {
            'border-blue-400 active': extra.voted,
            'border-gray-400': !extra.voted,
          },
          'w-12 h-12 rounded-full border flex justify-center items-center like-badge cursor-pointer',
        )}
        onClick={() => {
          extra.voted ? resetVote(postId) : createVote(postId);
        }}
      >
        <Badge
          badgeContent={Number(extra.upVotesCount) || 0}
          invisible={!Number(extra.upVotesCount)}
        >
          <div
            className={classNames(
              {
                'text-blue-400': extra.voted,
                'text-gray-600': !extra.voted,
              },
              'flex items-center text-xl',
            )}
          >
            <ThumbUp />
          </div>
        </Badge>
      </div>
    );
  };

  const { postExtraMap } = feedStore;
  const extra: any = postExtraMap[getPostId(post)] || {};

  const content = `在生活中，每个人都有一套自己的价值观，并形成一套处事原则，根据这套原则决定自己应该做什么，不应该做什么。可以说，所有的主动选择都是由价值观决定的。同理，在编程的世界里，程序员也需要一套原则，来规定自己应该做什么，不应该做什么。

  《程序员修炼之道 — 从小工到专家》一书给出了70条原则，可以作为每一个程序员的基本原则，我们可以根据这些原则来做正确的事情。
  
  1. 关心你的技艺
     Care About Your Craft
     如果你不在乎能否漂亮地开发出软件，你又为何要耗费生命去开发软件呢？
  
  2. 思考！你的工作
     Think! About Your Work
     关掉自动驾驶仪，接管操作。不断地批评和评估你的工作。
  
  3. 提供各种选择，不要找蹩脚的借口
     Provide Options, Don't Make Lame Excuses
     要提供各种选择，而不是找借口。不要说事情做不到；说明能够做什么。
  
  4. 不要容忍破窗户
     Don‘t Live with Broken Windows
     当你看到糟糕的设计、错误的决策和糟糕的代码，修正它们。
  
  5. 做变化的催化剂
     Be a Catalyst for Change
     你不能强迫人们改变。相反，要向他们展示未来可能会怎样，并帮助他们参与对未来的创造。
  
  6. 记住大图景
     Remember the Big Picture
     不要太过于专注细节，一致忘了查看你周围正在发生什么。
  
  7. 使质量成为需求问题
     Make Quality a Requirements Issue
     让你的用户参与确定真正的质量需求。
  
  8. 定期为你的知识资产投资
     Invest Regularly in Your Knowledge Portfolio
     让学习成为习惯。
  
  9. 批评地分析你读到的和听到的
     Critically Analyze What You Read and Hear
     不要被供应商、媒体炒作、或胶条左右。要按照你自己的看法和你的项目的情况去对信息进行分析。
  
  10. 你说什么和你怎么说同样重要
     It's Both What You Say and the Way You Say It
     如果你不能有效地向他人传达你的了不起想法，这些想法就毫无用处。
  
  11. 不要重复你自己
     DRY - Don't Repeat Yourself
     系统中的每一项知识都必须具有单一、无歧义、权威的表示。
  
  12. 让复用变得容易
     Make It Easy to Reuse
     如果复用很容易，人们就会去复用。创造一个支持复用的环境。
  
  13. 消除无关事物之间的影响
     Eliminate Effects Between Unrelated Thins
     设计自足、独立、并具有单一、良好定义的目的的组件。
  
  14. 不存在最终决策
     There Are No Final Decisions
     没有决策是浇铸在石头上的。相反，要把每项决策都视为是写在沙滩上的，并为变化做好计划。
  
  15. 用曳光弹找到目标
     Use Tracer Bullets to Find the Target
     用曳光弹能通过试验各种事物并检查它们离目标有多远来让你追踪目标。
  
  16. 为了学习而制作原型
     Prototype to learn
     原型制作是一种学习经验。其价值并不在于所产生的代码，而在于所学到的教经验教训。
  
  17. 靠近问题领域编程
     Program Close to the Problem domain
     用你的用户的语言进行设计和编码
  
  18. 估算，以避免发生意外
     Estimate to Avoid Surprises
     在着手之前先进行估算。你将提前发现潜在的问题。
  
  19. 通过代码对进度表进行迭代
     Iterate the Schedule with the Code
     用你在进行实现时获得的经验提炼项目的时间标度。
  
  20. 用纯文本保存知识
     Keep Knowledge in Plain Text
     纯文本不会过时。它能够帮助你有效利用你的工作，并简化调试和测试。
  
  21. 利用命令shell的力量
     Use the Power of Command Shells
     当图形用户界面无能为力时使用shell。
  
  22. 用好一种编辑器
     Use a Single Editor Well
     编辑器应该是你的手的延伸；确保你的编辑器是可配置、可拓展和可编程的。
  
  23. 总是使用源码控制
     Always Use Source Code Control
     源码控制是你的工作的时间机器 — 你能够回到过去。
  
  24. 要修正问题，而不是发出指责
     Fix the Problem, Not the Blame
     bug是你的过程还是别人的过程，并不是很重要 — 它仍然是你的问题，它仍然需要被修正。
  
  25. 不要恐慌
     Don't Panic When Debuging
     做一次深呼吸，思考什么可能是bug的原因。
  
  26. “Select”没有问题
     “select” Isn't Broken
     在OS或者是编译器、或者是第三方产品或库中很少发现bug。bug很可能在应用中。
  
  27. 不要假定，要证明
     Don't Assume It — Prove It
     在实际环境中 — 使用真正的数据和边界条件 — 证明你的假定。
  
  28. 学习一种文本操作语言
     Learn a Text Manipilation Language
     你用每天的很大一部分时间处理文本，为什么不让计算机替你完成部分工作呢？
  
  29. 编写能编写代码的代码
     Write Code That Writes Code
     代码生成器能提高你的生产率，并有助于避免重复。
  
  30. 你不可能写出完美的软件
     You Can't Write Perfect Software
     软件不可能完美。保护你的代码和用户，使它（他）们免于能够预见的错误。
  
  31. 通过合约进行设计
     Design with Caontracts
     使用合约建立文档，并检验代码所做的事情正好是它声明要做的。
  
  32. 早崩溃
     Crash Early
     死程序造成的危害通常比有问题的程序要小得多。
  
  33. 用断言避免不可能发生的事情
     Use Assertions to Prevent the Impossible
     断言验证你的各种假定。在一个不确定的世界里，用断言保护你的代码。
  
  34. 将异常用于异常的问题
     Use Exceptions for Exceptional Problems
     异常可能会遭受经典的意大利面条式的所有可能性和可维护性问题的折磨。将异常保给异常的事物。
  
  35. 要有始有终
     Finish What You Start
     只要可能，分配某资源的例程或对象也应该负责接触其分配。
  
  36. 是模块之间的耦合减至最少
     Minimize Coupling Between Modules
     通过编写“羞涩的”代码并应用得墨芯耳法则来避免耦合。
  
  37. 要配置，不要集成
     Configure, Don't Integrate
     要将应用的各种技术选择实现为可配置，而不是通过集成或工程方法实现。
  
  38. 将抽象放进代码，细节放进元数据
     Put Abstractions in Code, Details in Metadata
     为一本情况编程，将细节放在被编译的代码库之外。
  
  39. 分析工作流，以改善并发性
     Analyze Workflow to Improve Concurrency
     利用你的用户的工作流中的并发性。
  
  40. 用服务进行设计
     Design Using Services
     根据服务 — 独立的、在良好定义、一致的接口之后的并发对象 — 进行设计。
  
  41. 总是为并发进行设计
     Always Design for Concurrency
     容许并发，你将会设计出更整洁、具有更少假定的接口。
  
  42. 使试图与模型分离
     Separate Views form Medels
     要根据模型和视图设计你的应用，从而以低廉的代码获取灵活性。
  
  43. 用黑板协调工作流
     Use BlackBoards to Coordinate Workflow
     用黑板协调完全不同的事实和因素，同时又使各参与方保持独立和隔离。
  
  44. 不要靠巧合编程
     Dont't Program by Coincidence
     只依靠可靠的事物。注意偶发现的复杂性，不要把幸运的巧合与有目的的计划混为一谈。
  
  45. 估算你的算法的阶
     Estimate the Order of Your Algorithms
     在你编写代码之前，先大致估算事情需要多长时间。
  
  46. 测试你的估算
     Test Your Estimates
     对算法的数据分析并不会告诉你每一件事情。在你的代码的目标环境中测定它的速度。
  
  47. 早重构，常重构
     Refactor Early, Refactor Often
     就和你会在花园里除草、并重新布置一样，在需要时对代码进行重新、重做和重新架构。要铲除问题的根源。
  
  48. 为测试而设计
     Design to Test
     在你还没有编写代码时就开始思考问题。
  
  49. 测试你的软件，否则你的用户就得测试
     Test Your Software, or Your Users Will
     无情地测试。不要让你的用户为你查找bug。
  
  50. 不要使用你不理解的向导代码
     Don't Use Wizard Code You Don't Understand
     向导可以生成大量代码。在你把它们合并进你的项目之前，确保你理解全部的代码。
  
  51. 不要搜集需求 — 挖掘它们
     Don't Gather Requirements — Dig for Them
     需求很少存于表面上。它们深深地埋藏在层层假定、误解和政治手段的下面。
  
  52. 与用户一同工作，以像用户一样思考
     Work with a User to Think Like a User
     要了解系统实际上将如何被使用，这是最好的方法。
  
  53. 抽象比细节活得更长久
     Abstractions Live Longer than Details
     “投资”于抽象，而不是实现。抽象能在来自不同的实现和新技术的变化的“攻击”之下活下去。
  
  54. 使用项目词汇表
     Use a Project Glossary
     创建并维护项目中使用的专用术语和词汇的单一信息源。
  
  55. 不要在盒子外面思考 — 要找到盒子
     Don't Think Outside the Box — Find the Box
     在遇到不可能解决的问题时，要确定真正的约束。问问你自己：“它必须以这种方式完成吗？它真的必须完成吗？”
  
  56. 等你准备好再开始
     Start When You're Ready
     你的一生都在积累经验。不要忽视反复出现的疑虑。
  
  57. 对有些事情“做”胜于“描述”
     Some Things Are Better Done than Described
     不要掉进规范的螺旋 — 在某个时刻，你需要开始编码。
  
  58. 不要做形式方法的奴隶
     Don't Be a Slave to Formal Methods
     如果你没有把某些技术放进你的开发实践和能力的语境中，不要盲目地采用它。
  
  59. 昂贵的工具不一定能制作出更好的设计
     Costly Tools Don't Produce Better Designs
     小心供应商的炒作、行业教条、以及价格标签的诱惑。要根据工具的价值判断它们。
  
  60. 围绕功能组织团队
     Organize Teams Around Functionality
     不要把设计师与编码员分开，也不要把测试员与数据建模员分开。按照你构建代码的方式构建团队。
  
  61. 不要使用手工流程
     Don't Use Manual Procedures
     shell脚本或批文件会一次次地以同一顺序执行相同的指令。
  
  62. 早测试、常测试、自动测试
     Test Early, Text Often, Text Automatically
     与待在书架上的测试计划相比，每次构建时运行测试要有效得多。
  
  63. 要到通过全部测试，编码才算完成
     Coding Ain't Done, Till All the Tests Run
     就是这样。
  
  64. 通过“蓄意破坏”测试你的测试
     Use Saboteurs to Test Your Testing
     在单独的软件副本上故意引入bug，以检验测试能够抓住它们。
  
  65. 测试状态覆盖，而不是代码覆盖
     Test State Coverage, Not Code Coverage
     确定并测试重要的程序状态。只是测试代码行是不够的。
  
  66. 一个bug只抓一次
     Find Bugs Once
     一旦测试员找到一个bug，这应该是测试员最后一次找到它。此后自动测试应该对其进行检查。
  
  67. 英语就是一种编程语言
     English is just a Programming Language
     像你编写代码一样编写文档：遵守DRY原则、使用元数据、MVC、自动生成等等。
  
  68. 把文档建在里面，不要栓在外面
     Build Documentation In. Don't Bolt It On
     与代码分离的文档不太可能被修正和更新。
  
  69. 温和地超出用户的期待
     Gently Exceed Your Users' Expectations
     要理解你的用户的期望，然后给他们的东西要多那么一点。
  
  70. 在你的作品上签名
     Sign Your Work
     过去时代的手艺人为能在他们的作品上签名而自豪。你也应该如此。
  `;

  return (
    <Fade in={true} timeout={500}>
      <div className="px-4 md:px-0 md:w-7/12 m-auto relative">
        <div className="hidden md:block">
          <BackButton />
        </div>
        {isPc && (
          <div className="absolute top-0 left-0 -ml-24 mt-24">{VoteView(post.id, extra)}</div>
        )}
        <h2 className={`text-xl md:text-2xl text-gray-900 md:font-bold pt-0 pb-0`}>{post.title}</h2>
        <div className={`flex items-center gray mt-2 info ${isMobile ? ' text-sm' : ''}`}>
          <div className="flex items-center w-6 h-6 mr-2">
            <img
              className="w-6 h-6 rounded-full border border-gray-300"
              src={post.attributes.avatar}
              alt={post.author}
            />
          </div>
          <span className="mr-5">{post.author}</span>
          <span className="mr-5">{ago(post.pubDate)}</span>
        </div>
        <style jsx>{`
          .gray {
            color: #aea9ae;
          }
          :global(.like-badge .MuiBadge-badge) {
            top: -8px;
            right: -8px;
            color: #fff;
            background: #66758b;
          }
          :global(.like-badge.active .MuiBadge-badge) {
            color: #fff;
            background: #63b3ed;
          }
        `}</style>
        <div
          className={`mt-6 text-base md:text-lg text-black markdown-body pb-6 px-1 md:px-0`}
          dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
        />
        <div className="hidden md:block">
          {
            <div className="fixed bottom-0 right-0 mr-10 mb-10 cursor-pointer" onClick={backToTop}>
              <ButtonOutlined>
                <div className="text-xl">
                  <ArrowUpward />
                </div>
              </ButtonOutlined>
            </div>
          }
        </div>
        {isMobile && (
          <div className="flex items-center justify-center pt-5">
            {authorMixinClientId && (
              <div
                className="text-white w-12 h-12 rounded-full border flex justify-center items-center like-badge cursor-pointer border-blue-400 text-base font-bold bg-blue-400 mr-8"
                onClick={reward}
              >
                赏
              </div>
            )}
            <div className="flex justify-center">{VoteView(post.id, extra)}</div>
            {!authorMixinClientId && <div className="pb-30" />}
          </div>
        )}
        {authorMixinClientId && RewardView()}
        {!authorMixinClientId && <div className="mt-16 pb-8 border-t border-gray-300" />}
        {CommentView()}
        <RewardModal
          open={openRewardModal}
          onClose={onCloseRewardModal}
          toAddress={toAddress}
          toAuthor={post.author}
          fileRId={post.id}
          toMixinClientId={authorMixinClientId}
        />
        <Viewer
          onMaskClick={() => setShowImage(false)}
          noNavbar={true}
          noToolbar={true}
          visible={showImage}
          onClose={() => setShowImage(false)}
          images={[{ src: imgSrc }]}
        />
      </div>
    </Fade>
  );
});
